import { Camera, MapView } from '@rnmapbox/maps';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

import { Coordinates, MemoryMood } from '../../../models/types';
import {
  MapboxSearchResult,
  reverseGeocodeAddress,
  reverseGeocodePoi,
} from '../../../services/mapboxSearch';
import { primeReverseGeocodedAddress } from '../../../hooks/useReverseGeocodedAddress';
import { copyPhotosToAppStorage } from '../../../shared/photoStorage';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { isNullIsland } from '../../../shared/geo';
import { DEFAULT_CENTER, DEFAULT_ZOOM, WORLD_ZOOM } from '../constants';
import { NativePoiMarker, PendingSearchMarker } from '../types';

// Shown on the card for the moment between a long press and its reverse lookup answering.
const PENDING_PIN_NAME = 'Looking up this spot…';

// Shared so a card that resolved to nothing keeps a stable `resolvedDetails` identity across
// re-renders — the callout hands it straight to a dependency array.
const EMPTY_RESOLVED_DETAILS = {} as const;

// A memory composed on the place form, before the place it belongs to exists. Held only in
// the sheet's state: closing the sheet without saving discards it along with everything else,
// which is the whole point — nothing is written until the place is.
export interface QuickAddMemoryDraft {
  text: string;
  photoUris: string[];
  mood?: MemoryMood;
  companions: string[];
}

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
  memory?: QuickAddMemoryDraft;
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
  // A long press starts one or two reverse lookups that outlive the gesture. Anything that
  // decides what card is on screen — another press, a tap, closing the card, opening the save
  // form — has to disown the one in flight, or its answer lands seconds later and overwrites
  // what the user actually chose. The counter is what makes the late answer a no-op; the
  // controller stops the request itself so a dead lookup does not hold the connection.
  const poiLookupIdRef = useRef(0);
  const poiLookupAbortRef = useRef<AbortController | null>(null);
  const cancelPoiLookup = useCallback(() => {
    poiLookupIdRef.current += 1;
    poiLookupAbortRef.current?.abort();
    poiLookupAbortRef.current = null;
  }, []);

  // Field selectors rather than the whole store: the map screen reads `places` and never
  // `notes`, and pulling the store wholesale re-rendered the entire map — markers, cards and
  // all — every time a memory was written. The memory composer on the place form made that a
  // routine event rather than a rare one. Zustand actions are stable, so those never re-render.
  const places = usePlacesStore((state) => state.places);
  const addPlace = usePlacesStore((state) => state.addPlace);
  const deletePlace = usePlacesStore((state) => state.deletePlace);
  const addNote = usePlacesStore((state) => state.addNote);
  const profile = useProfileStore((state) => state.profile);

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

  // A long press and a light tap now do the same thing: open the card with the three
  // actions. Dropping straight into the save form skipped the choice — from a bare point on
  // the map you may well want directions or a web search instead, and there was no way back
  // to those without cancelling the form first.
  const handleLongPress = useCallback(
    (feature: { geometry: { coordinates: [number, number] } }) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const coords = { latitude, longitude };
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: currentZoom.current,
        animationDuration: 0,
      });
      // Whatever else was open belongs to a different point, including any lookup still
      // running for the last one.
      cancelPoiLookup();
      setDismissSignal((n) => n + 1);

      // On screen straight away, under a placeholder name. The lookups below are one or two
      // network round trips, and waiting them out before showing anything made a long press
      // look like it had simply been ignored. The card keeps this id while its name and
      // address fill in, so it updates in place instead of remounting.
      const cardId = `pin-${longitude}-${latitude}-${Date.now()}`;
      setNativePoiMarker({
        id: cardId,
        name: PENDING_PIN_NAME,
        coordinates: coords,
        resolvedDetails: EMPTY_RESOLVED_DETAILS,
        pending: true,
      });

      const requestId = poiLookupIdRef.current;
      const abort = new AbortController();
      poiLookupAbortRef.current = abort;

      void (async () => {
        // A press that landed on a venue the basemap knows should name it, so the card reads
        // the same as it would from a tap — and the Search Box answer already carries the
        // address, phone and website, so the callout never has to buy them a second time.
        // Only then fall back to naming the point by its street address, and to a plain label
        // when even that is unavailable (open country, water).
        const poi = await reverseGeocodePoi(coords, abort.signal);
        if (requestId !== poiLookupIdRef.current) return;

        if (poi) {
          // Whatever the sheet would look up next is already in hand — hand it over rather
          // than let it buy the same answer again.
          primeReverseGeocodedAddress(poi.coordinates, poi.address ?? null);
          setNativePoiMarker({
            id: cardId,
            name: poi.name,
            maki: poi.maki,
            coordinates: poi.coordinates,
            resolvedDetails: {
              address: poi.address,
              phone: poi.phone,
              website: poi.website,
            },
          });
          return;
        }

        const address = await reverseGeocodeAddress(coords, abort.signal);
        if (requestId !== poiLookupIdRef.current) return;
        primeReverseGeocodedAddress(coords, address);

        setNativePoiMarker({
          id: cardId,
          name: address ?? 'Dropped pin',
          coordinates: coords,
          resolvedDetails: address ? { address } : EMPTY_RESOLVED_DETAILS,
        });
      })();
    },
    [cancelPoiLookup],
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

  const handleMapPress = useCallback(
    async (feature: ScreenPointFeature) => {
      if (annotationTapRef.current) return;
      const { screenPointX, screenPointY } = feature.properties;
      if (screenPointX == null || screenPointY == null) return;

      // This tap decides what card is open from here on. Disowns a long-press lookup still in
      // flight, which would otherwise land a moment later and replace whatever this tap opened
      // — or reopen the card this tap dismissed.
      cancelPoiLookup();

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
          typeof poiFeature.properties?.class === 'string'
            ? poiFeature.properties.class
            : undefined,
        coordinates: { latitude, longitude },
      });
    },
    [cancelPoiLookup],
  );

  const handleCloseNativePoiMarker = useCallback(() => {
    // Without this, a slow answer arriving after the user dismissed the card would put it
    // straight back on screen.
    cancelPoiLookup();
    setNativePoiMarker(null);
  }, [cancelPoiLookup]);

  const handleConfirmNativePoiMarker = useCallback(
    (marker: NativePoiMarker, details?: { address?: string; phone?: string; website?: string }) => {
      cancelPoiLookup();
      setPendingPlaceCoords(marker.coordinates);
      // The basemap already knows what this place is called — seed the form with it rather
      // than making the user retype a name that's printed right there on the map. The callout
      // has usually resolved address/phone/website by now too, so those carry over as well.
      setPendingPlaceMeta({ name: marker.name, maki: marker.maki, ...details });
      setNativePoiMarker(null);
      setShowQuickAddSheet(true);
    },
    [cancelPoiLookup],
  );

  const handleCloseQuickAddSheet = useCallback(() => {
    cancelPoiLookup();
    setShowQuickAddSheet(false);
    setPendingPlaceCoords(null);
    setPendingPlaceMeta(null);
  }, [cancelPoiLookup]);

  // Opens the quick-add sheet at a route waypoint's coordinates — used by "Save this point"
  // in the RouteDestinationMarker callout, same as confirming a search result or POI.
  const handleSaveWaypointAsPlace = useCallback(
    (coordinates: Coordinates) => {
      cancelPoiLookup();
      setPendingPlaceCoords(coordinates);
      setPendingPlaceMeta(null);
      setShowQuickAddSheet(true);
    },
    [cancelPoiLookup],
  );

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

      // A memory composed on the form wins: it is an explicit entry about a visit, with its
      // own photos, mood and companions. Without one the place's own note/photos/mood still
      // become a note, exactly as before — that is what every place saved so far has done.
      if (data.memory) {
        const memoryPhotoUris = await copyPhotosToAppStorage(data.memory.photoUris);
        addNote({
          placeId,
          text: data.memory.text,
          photoUri: memoryPhotoUris[0],
          photoUris: memoryPhotoUris.length > 0 ? memoryPhotoUris : undefined,
          mood: data.memory.mood,
          companions: data.memory.companions,
          createdAt: new Date().toISOString(),
        });
      } else if (description || photoUris.length > 0 || data.mood) {
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

      cancelPoiLookup();
      setShowQuickAddSheet(false);
      setPendingPlaceCoords(null);
      setPendingPlaceMeta(null);
    },
    [pendingPlaceCoords, pendingPlaceMeta, addPlace, addNote, cancelPoiLookup],
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

  const handleConfirmSearchResultMarker = useCallback(
    (marker: PendingSearchMarker) => {
      cancelPoiLookup();
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
    },
    [cancelPoiLookup],
  );

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
