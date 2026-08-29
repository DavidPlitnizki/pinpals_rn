import { Camera, MapView } from '@rnmapbox/maps';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

import { Coordinates, MemoryMood } from '../../../models/types';
import { MapboxSearchResult, reverseGeocodeAddress } from '../../../services/mapboxSearch';
import { copyPhotosToAppStorage } from '../../../shared/photoStorage';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { isNullIsland } from '../../../shared/geo';
import { DEFAULT_CENTER, DEFAULT_ZOOM, WORLD_ZOOM } from '../constants';
import { NativePoiMarker, PendingSearchMarker } from '../types';

export interface QuickAddSaveData {
  name: string;
  description: string;
  photoUris: string[];
  mood?: MemoryMood;
  rating: number;
  favorite: boolean;
  wantToVisit: boolean;
  pinColor?: string;
  mainPhotoUri?: string;
  tags: string[];
  phone?: string;
}

type ScreenPointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  { screenPointX: number; screenPointY: number }
>;

// A tap that lands on one of our own PointAnnotations (place/search-result markers) also
// fires MapView's onPress — the annotation's onSelected calls this to suppress the
// resulting native-POI query, cleared shortly after so a genuine later tap still works.
const ANNOTATION_TAP_GUARD_MS = 300;

export function useMapScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const mapViewRef = useRef<MapView>(null);
  const annotationTapRef = useRef(false);
  const { places, addPlace, deletePlace, addNote } = usePlacesStore();
  const { profile } = useProfileStore();

  const currentCenter = useRef<[number, number]>(DEFAULT_CENTER);
  const currentZoom = useRef<number>(DEFAULT_ZOOM);

  const [locationGranted, setLocationGranted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<Coordinates | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // The add-place form was removed; this now only drives the "will be soon" placeholder
  // sheet and the green preview pin at the chosen point.
  const [showQuickAddSheet, setShowQuickAddSheet] = useState(false);
  const [pendingPlaceCoords, setPendingPlaceCoords] = useState<Coordinates | null>(null);
  // Address/phone/website carried over from a search result's Mapbox metadata, if the
  // pending place came from one — native basemap POI taps and route-waypoint saves have no
  // such metadata to offer, so this is null for those flows.
  const [pendingPlaceMeta, setPendingPlaceMeta] = useState<{
    name?: string;
    address?: string;
    phone?: string;
    website?: string;
    imageUrl?: string;
    maki?: string;
  } | null>(null);

  const [searchResultMarkers, setSearchResultMarkers] = useState<PendingSearchMarker[]>([]);
  const [nativePoiMarker, setNativePoiMarker] = useState<NativePoiMarker | null>(null);
  // Bumped on any map tap that didn't land on one of our own annotations — tells the
  // on-map callouts (My Places / search result) to close, the same way tapping a
  // different annotation would.
  const [dismissSignal, setDismissSignal] = useState(0);
  // "Hide my places": lets the user clear their own saved pins off the map to see search
  // results / the basemap underneath. Purely a view filter — nothing is deleted.
  const [myPlacesHidden, setMyPlacesHidden] = useState(false);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastGPS, setToastGPS] = useState(false);

  const showToast = useCallback(
    (msg: string, isGPS: boolean) => {
      setToastMsg(msg);
      setToastGPS(isGPS);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [toastAnim],
  );

  const applyLocation = useCallback(
    (latitude: number, longitude: number) => {
      const coords = { latitude, longitude };
      setGpsCoords(coords);
      currentCenter.current = [longitude, latitude];
      currentZoom.current = DEFAULT_ZOOM;
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 800,
      });
      showToast('Centred on your GPS location', true);
    },
    [showToast],
  );

  // Without a position the camera would sit at DEFAULT_CENTER — (0, 0), open ocean — which
  // looks like a failed map rather than a missing permission. Fall back to the most recently
  // saved place if there is one, otherwise pull back to a world view.
  const fallbackToKnownLocation = useCallback(() => {
    const saved = usePlacesStore.getState().places;
    const newest = saved[saved.length - 1];
    if (newest) {
      currentCenter.current = [newest.coordinates.longitude, newest.coordinates.latitude];
      currentZoom.current = DEFAULT_ZOOM;
      cameraRef.current?.setCamera({
        centerCoordinate: currentCenter.current,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 0,
      });
      return;
    }
    currentZoom.current = WORLD_ZOOM;
    cameraRef.current?.setCamera({
      centerCoordinate: DEFAULT_CENTER,
      zoomLevel: WORLD_ZOOM,
      animationDuration: 0,
    });
  }, []);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied', false);
        fallbackToKnownLocation();
        return;
      }

      setLocationGranted(true);

      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        applyLocation(last.coords.latitude, last.coords.longitude);
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      applyLocation(loc.coords.latitude, loc.coords.longitude);
    } catch {
      // Permission was granted above, so a failure here almost always means Location
      // Services is off system-wide (Settings, not the per-app toggle) — a toast for that
      // reads as a fleeting glitch when it's actually a switch the user needs to go flip.
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services is off',
          'Turn on Location Services in Settings to see your position on the map and get directions.',
        );
      } else {
        showToast('Could not get location', false);
      }
      fallbackToKnownLocation();
    }
  }, [applyLocation, showToast, fallbackToKnownLocation]);

  // One-time permission request + location fetch on mount; requestLocation's identity is
  // stable (see its useCallback deps), so this effect only ever runs once.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocation();
  }, [requestLocation]);

  // FlyTo is a one-off camera jump — it doesn't set any "fake current location", just moves
  // the map to the place the user typed/picked in FlyToSheet.
  const handleConfirmFlyTo = useCallback(
    (coords: Coordinates, label: string) => {
      currentCenter.current = [coords.longitude, coords.latitude];
      cameraRef.current?.setCamera({
        centerCoordinate: [coords.longitude, coords.latitude],
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 1200,
      });
      showToast(`Flew to ${label}`, false);
    },
    [showToast],
  );

  const toggleMyPlacesHidden = useCallback(() => setMyPlacesHidden((hidden) => !hidden), []);

  const getMapCenter = useCallback((): Coordinates => {
    const [longitude, latitude] = currentCenter.current;
    return { latitude, longitude };
  }, []);

  // True while the camera has never been given a real position — callers that would
  // otherwise query weather/geocoding for the Gulf of Guinea skip the request instead.
  const hasRealLocation = !isNullIsland(getMapCenter());

  // Mapbox's own service limits make a user-adjustable search radius pointless — search is
  // scoped to whatever bbox is actually on screen instead, read fresh off the native map each
  // time (not derived from currentCenter/zoom, which don't capture aspect ratio/tilt).
  const getVisibleBbox = useCallback(async (): Promise<
    [number, number, number, number] | undefined
  > => {
    try {
      const bounds = await mapViewRef.current?.getVisibleBounds();
      if (!bounds) return undefined;
      const [[rightLon, topLat], [leftLon, bottomLat]] = bounds;
      return [leftLon, bottomLat, rightLon, topLat];
    } catch {
      return undefined;
    }
  }, []);

  const handleCenterGPS = useCallback(async () => {
    if (!gpsCoords) {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services is off',
          'Turn on Location Services in Settings to see your position on the map.',
        );
      }
      return;
    }
    cameraRef.current?.setCamera({
      centerCoordinate: [gpsCoords.longitude, gpsCoords.latitude],
      zoomLevel: currentZoom.current,
      animationDuration: 600,
    });
  }, [gpsCoords]);

  const handleLongPress = useCallback(
    (feature: { geometry: { coordinates: [number, number] } }) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Instant, not a 600ms animation: the sheet opens at full height and covers the map
      // anyway, so the animation bought nothing while flooding the native map with camera
      // work (and onCameraChanged callbacks) exactly as the form was mounting.
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: currentZoom.current,
        animationDuration: 0,
      });
      setPendingPlaceCoords({ latitude, longitude });
      // A bare map point carries no name/address of its own — must not inherit the previous
      // pending place's metadata.
      setPendingPlaceMeta(null);
      setShowQuickAddSheet(true);
    },
    [],
  );

  // Closes whichever map card is open — the marker components watch dismissSignal and clear
  // their own selection when it changes.
  const dismissCallouts = useCallback(() => setDismissSignal((n) => n + 1), []);

  const markAnnotationTapped = useCallback(() => {
    annotationTapRef.current = true;
    setTimeout(() => {
      annotationTapRef.current = false;
    }, ANNOTATION_TAP_GUARD_MS);
  }, []);

  const handleMapPress = useCallback(async (feature: ScreenPointFeature) => {
    if (annotationTapRef.current) return;
    const { screenPointX, screenPointY } = feature.properties;
    if (screenPointX == null || screenPointY == null) return;

    let collection;
    try {
      collection = await mapViewRef.current?.queryRenderedFeaturesAtPoint([
        screenPointX,
        screenPointY,
      ]);
    } catch {
      // Native query can fail transiently (e.g. style still loading) — a tap that
      // can't be resolved to a POI should just be a no-op, not an unhandled rejection.
      return;
    }

    // A tap on one of our own annotations may have landed while the native query was
    // in flight — don't surface a native-POI card on top of/instead of it.
    if (annotationTapRef.current) return;

    const poiFeature = collection?.features.find(
      (f) => typeof f.properties?.name === 'string' && f.properties.name.trim().length > 0,
    );

    // The tap didn't land on one of our own markers (already ruled out above) — whatever
    // callout is currently open (My Places pin, search result) should close, same as
    // tapping a different annotation would. Only one popup makes sense at a time.
    setDismissSignal((n) => n + 1);

    if (!poiFeature) {
      setNativePoiMarker(null);
      return;
    }

    const [longitude, latitude] =
      poiFeature.geometry.type === 'Point'
        ? (poiFeature.geometry.coordinates as [number, number])
        : feature.geometry.coordinates;

    setNativePoiMarker({
      id: `poi-${longitude}-${latitude}-${Date.now()}`,
      name: poiFeature.properties!.name as string,
      maki:
        typeof poiFeature.properties?.maki === 'string' ? poiFeature.properties.maki : undefined,
      category:
        typeof poiFeature.properties?.class === 'string' ? poiFeature.properties.class : undefined,
      coordinates: { latitude, longitude },
    });
  }, []);

  const handleCloseNativePoiMarker = useCallback(() => {
    setNativePoiMarker(null);
  }, []);

  const handleConfirmNativePoiMarker = useCallback(
    (marker: NativePoiMarker, details?: { address?: string; phone?: string; website?: string }) => {
      setPendingPlaceCoords(marker.coordinates);
      // The basemap already knows what this place is called — seed the form with it rather
      // than making the user retype a name that's printed right there on the map. The callout
      // has usually resolved address/phone/website by now too, so those carry over as well.
      setPendingPlaceMeta({ name: marker.name, maki: marker.maki, ...details });
      setNativePoiMarker(null);
      setShowQuickAddSheet(true);
    },
    [],
  );

  const handleCloseQuickAddSheet = useCallback(() => {
    setShowQuickAddSheet(false);
    setPendingPlaceCoords(null);
    setPendingPlaceMeta(null);
  }, []);

  // Opens the quick-add sheet at a route waypoint's coordinates — used by "Save this point"
  // in the RouteDestinationMarker callout, same as confirming a search result or POI.
  const handleSaveWaypointAsPlace = useCallback((coordinates: Coordinates) => {
    setPendingPlaceCoords(coordinates);
    setPendingPlaceMeta(null);
    setShowQuickAddSheet(true);
  }, []);

  const handleSaveQuickAddPlace = useCallback(
    async (data: QuickAddSaveData) => {
      if (!pendingPlaceCoords) return;
      const name = data.name.trim() || 'New Pin';
      const description = data.description.trim();

      // Copy every picked photo into the app's own storage (by date) before persisting
      // anything — so what gets saved always points at a durable file, not a picker temp
      // path. The "main photo" pick is remapped to its copy by its position in the array.
      const photoUris = await copyPhotosToAppStorage(data.photoUris);

      // A point picked straight off the map (long-press, route waypoint) carries no address —
      // look one up so the saved card shows where it is instead of just coordinates. Best
      // effort: if the lookup fails the place is still saved, just without an address.
      const address =
        pendingPlaceMeta?.address ?? (await reverseGeocodeAddress(pendingPlaceCoords)) ?? undefined;
      const mainPhotoIndex = data.mainPhotoUri ? data.photoUris.indexOf(data.mainPhotoUri) : -1;
      const mainPhotoUri = mainPhotoIndex >= 0 ? photoUris[mainPhotoIndex] : undefined;

      const placeId = addPlace({
        name,
        description: description || undefined,
        coordinates: pendingPlaceCoords,
        tags: data.tags,
        rating: data.rating,
        isFavorite: data.wantToVisit,
        favorite: data.favorite,
        pinColor: data.pinColor,
        mainPhotoUri,
        address,
        coverImageUrl: pendingPlaceMeta?.imageUrl,
        maki: pendingPlaceMeta?.maki,
        phone: data.phone ?? pendingPlaceMeta?.phone,
        website: pendingPlaceMeta?.website,
      });

      if (description || photoUris.length > 0 || data.mood) {
        addNote({
          placeId,
          text: description,
          photoUri: photoUris[0],
          photoUris: photoUris.length > 0 ? photoUris : undefined,
          mood: data.mood,
          companions: [],
          createdAt: new Date().toISOString(),
        });
      }

      setShowQuickAddSheet(false);
      setPendingPlaceCoords(null);
      setPendingPlaceMeta(null);
    },
    [pendingPlaceCoords, pendingPlaceMeta, addPlace, addNote],
  );

  const handleSelectSearchResult = useCallback((result: MapboxSearchResult) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [result.coordinates.longitude, result.coordinates.latitude],
      zoomLevel: 16,
      animationDuration: 600,
    });
    setSearchResultMarkers([result]);
  }, []);

  const handleShowSearchResultsOnMap = useCallback((results: MapboxSearchResult[]) => {
    setSearchResultMarkers(results);
  }, []);

  const handleClearSearchResultMarkers = useCallback(() => {
    setSearchResultMarkers([]);
  }, []);

  const handleConfirmSearchResultMarker = useCallback((marker: PendingSearchMarker) => {
    setPendingPlaceCoords(marker.coordinates);
    setPendingPlaceMeta({
      name: marker.name,
      address: marker.fullAddress,
      phone: marker.phone,
      website: marker.website,
      imageUrl: marker.imageUrl,
      maki: marker.maki,
    });
    setSearchResultMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    setShowQuickAddSheet(true);
  }, []);

  // The "+" button has no map point to work from, so it falls back to the user's current
  // position (or the map centre).
  const handleAddAtCurrentLocation = useCallback(() => {
    const coords = gpsCoords ?? {
      latitude: currentCenter.current[1],
      longitude: currentCenter.current[0],
    };
    setPendingPlaceCoords(coords);
    setPendingPlaceMeta(null);
    setShowQuickAddSheet(true);
  }, [gpsCoords]);

  const handleMarkerPress = useCallback(
    (placeId: string) => {
      router.push({ pathname: '/place/[id]', params: { id: placeId } } as any);
    },
    [router],
  );

  const handleDeleteMarker = useCallback(
    (placeId: string, placeName: string) => {
      Alert.alert('Delete place', `Remove "${placeName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlace(placeId),
        },
      ]);
    },
    [deletePlace],
  );

  return {
    cameraRef,
    mapViewRef,
    places,
    profile,
    locationGranted,
    gpsCoords,
    handleConfirmFlyTo,
    showProfileMenu,
    showQuickAddSheet,
    pendingPlaceCoords,
    pendingPlaceMeta,
    searchResultMarkers,
    nativePoiMarker,
    dismissSignal,
    toastAnim,
    toastMsg,
    toastGPS,
    showToast,
    currentCenter,
    currentZoom,
    getMapCenter,
    getVisibleBbox,
    handleCenterGPS,
    handleLongPress,
    handleMapPress,
    markAnnotationTapped,
    dismissCallouts,
    handleCloseNativePoiMarker,
    handleConfirmNativePoiMarker,
    handleAddAtCurrentLocation,
    handleCloseQuickAddSheet,
    handleSaveWaypointAsPlace,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
    myPlacesHidden,
    toggleMyPlacesHidden,
    hasRealLocation,
    setShowProfileMenu,
  };
}
