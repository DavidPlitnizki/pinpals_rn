import { Camera, MapView } from '@rnmapbox/maps';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

import { Coordinates, MemoryMood } from '../../../models/types';
import { MapboxSearchResult } from '../../../services/mapboxSearch';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import { NativePoiMarker, PendingSearchMarker } from '../types';

export interface QuickAddSaveData {
  name: string;
  description: string;
  photoUris: string[];
  mood?: MemoryMood;
  rating: number;
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

  const [searchResultMarkers, setSearchResultMarkers] = useState<PendingSearchMarker[]>([]);
  const [nativePoiMarker, setNativePoiMarker] = useState<NativePoiMarker | null>(null);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastGPS, setToastGPS] = useState(false);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string, isGPS: boolean) {
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
  }

  async function requestLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied', false);
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
      showToast('Could not get location', false);
    }
  }

  function applyLocation(latitude: number, longitude: number) {
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
  }

  function handleCenterGPS() {
    if (!gpsCoords) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [gpsCoords.longitude, gpsCoords.latitude],
      zoomLevel: currentZoom.current,
      animationDuration: 600,
    });
  }

  function handleLongPress(feature: { geometry: { coordinates: [number, number] } }) {
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
    setShowQuickAddSheet(true);
  }

  function markAnnotationTapped() {
    annotationTapRef.current = true;
    setTimeout(() => {
      annotationTapRef.current = false;
    }, ANNOTATION_TAP_GUARD_MS);
  }

  async function handleMapPress(feature: ScreenPointFeature) {
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
    if (!poiFeature) return;

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
  }

  function handleCloseNativePoiMarker() {
    setNativePoiMarker(null);
  }

  function handleConfirmNativePoiMarker(marker: NativePoiMarker) {
    setPendingPlaceCoords(marker.coordinates);
    setNativePoiMarker(null);
    setShowQuickAddSheet(true);
  }

  function handleCloseQuickAddSheet() {
    setShowQuickAddSheet(false);
    setPendingPlaceCoords(null);
  }

  function handleSaveQuickAddPlace(data: QuickAddSaveData) {
    if (!pendingPlaceCoords) return;
    const name = data.name.trim() || 'New Pin';
    const description = data.description.trim();
    const placeId = addPlace({
      name,
      description: description || undefined,
      coordinates: pendingPlaceCoords,
      category: 'nature',
      rating: data.rating,
      isFavorite: false,
    });

    if (description || data.photoUris.length > 0 || data.mood) {
      addNote({
        placeId,
        text: description,
        photoUri: data.photoUris[0],
        photoUris: data.photoUris.length > 0 ? data.photoUris : undefined,
        mood: data.mood,
        companions: [],
        createdAt: new Date().toISOString(),
      });
    }

    setShowQuickAddSheet(false);
    setPendingPlaceCoords(null);
  }

  function handleSelectSearchResult(result: MapboxSearchResult) {
    cameraRef.current?.setCamera({
      centerCoordinate: [result.coordinates.longitude, result.coordinates.latitude],
      zoomLevel: 16,
      animationDuration: 600,
    });
    setSearchResultMarkers([result]);
  }

  function handleShowSearchResultsOnMap(results: MapboxSearchResult[]) {
    setSearchResultMarkers(results);
  }

  function handleClearSearchResultMarkers() {
    setSearchResultMarkers([]);
  }

  function handleConfirmSearchResultMarker(marker: PendingSearchMarker) {
    setPendingPlaceCoords(marker.coordinates);
    setSearchResultMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    setShowQuickAddSheet(true);
  }

  // The "+" button has no map point to work from, so it falls back to the user's current
  // position (or the map centre).
  function handleAddAtCurrentLocation() {
    const coords = gpsCoords ?? {
      latitude: currentCenter.current[1],
      longitude: currentCenter.current[0],
    };
    setPendingPlaceCoords(coords);
    setShowQuickAddSheet(true);
  }

  function handleMarkerPress(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } } as any);
  }

  function handleDeleteMarker(placeId: string, placeName: string) {
    Alert.alert('Delete place', `Remove "${placeName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePlace(placeId),
      },
    ]);
  }

  return {
    cameraRef,
    mapViewRef,
    places,
    profile,
    locationGranted,
    gpsCoords,
    showProfileMenu,
    showQuickAddSheet,
    pendingPlaceCoords,
    searchResultMarkers,
    nativePoiMarker,
    toastAnim,
    toastMsg,
    toastGPS,
    currentCenter,
    currentZoom,
    handleCenterGPS,
    handleLongPress,
    handleMapPress,
    markAnnotationTapped,
    handleCloseNativePoiMarker,
    handleConfirmNativePoiMarker,
    handleAddAtCurrentLocation,
    handleCloseQuickAddSheet,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
    setShowProfileMenu,
  };
}
