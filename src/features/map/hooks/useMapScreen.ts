import { Camera } from '@rnmapbox/maps';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

import { Coordinates } from '../../../models/types';
import { MapboxSearchResult } from '../../../services/mapboxSearch';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import { AddPlaceState, PendingSearchMarker, QuickAddPlaceState } from '../types';

export function useMapScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const { places, addPlace, deletePlace, addNote } = usePlacesStore();
  const { profile } = useProfileStore();

  const currentCenter = useRef<[number, number]>(DEFAULT_CENTER);
  const currentZoom = useRef<number>(DEFAULT_ZOOM);

  const [locationGranted, setLocationGranted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<Coordinates | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [addPlaceState, setAddPlaceState] = useState<AddPlaceState>({
    name: '',
    category: 'nature',
    rating: 3,
    description: '',
    coordinates: null,
  });
  const [showQuickAddSheet, setShowQuickAddSheet] = useState(false);
  const [quickAddState, setQuickAddState] = useState<QuickAddPlaceState>({
    name: '',
    rating: 5,
    description: '',
    photoUris: [],
    coordinates: null,
    createdAt: new Date().toISOString(),
  });

  const [searchResultMarkers, setSearchResultMarkers] = useState<PendingSearchMarker[]>([]);
  const [mutedSearchMarkers, setMutedSearchMarkers] = useState<PendingSearchMarker[]>([]);

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

  function makeQuickAddState(name: string, coordinates: Coordinates): QuickAddPlaceState {
    return {
      name,
      rating: 5,
      description: '',
      photoUris: [],
      mood: undefined,
      coordinates,
      createdAt: new Date().toISOString(),
    };
  }

  function handleLongPress(feature: { geometry: { coordinates: [number, number] } }) {
    const [longitude, latitude] = feature.geometry.coordinates;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: currentZoom.current,
      animationDuration: 600,
    });
    setQuickAddState(makeQuickAddState('', { latitude, longitude }));
    setShowQuickAddSheet(true);
  }

  function handleCloseQuickAddSheet() {
    setShowQuickAddSheet(false);
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
    setMutedSearchMarkers((prev) => [...prev, ...searchResultMarkers]);
    setSearchResultMarkers([]);
  }

  function handleConfirmSearchResultMarker(marker: PendingSearchMarker) {
    setQuickAddState(makeQuickAddState(marker.name, marker.coordinates));
    setSearchResultMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    setShowQuickAddSheet(true);
  }

  async function handlePickQuickAddPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to the photo library.');
      return;
    }
    const remaining = 5 - quickAddState.photoUris.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setQuickAddState((s) => ({ ...s, photoUris: [...s.photoUris, ...newUris].slice(0, 5) }));
    }
  }

  function handleRemoveQuickAddPhoto(uri: string) {
    setQuickAddState((s) => ({ ...s, photoUris: s.photoUris.filter((u) => u !== uri) }));
  }

  function handleSaveQuickAddPlace() {
    if (!quickAddState.coordinates) return;
    const name = quickAddState.name.trim() || 'New Pin';
    const placeId = addPlace({
      name,
      coordinates: quickAddState.coordinates,
      category: 'nature',
      rating: quickAddState.rating,
      isFavorite: false,
    });

    const description = quickAddState.description.trim();
    if (description || quickAddState.photoUris.length > 0 || quickAddState.mood) {
      addNote({
        placeId,
        text: description,
        photoUri: quickAddState.photoUris[0],
        photoUris: quickAddState.photoUris.length > 0 ? quickAddState.photoUris : undefined,
        mood: quickAddState.mood,
        companions: [],
        createdAt: quickAddState.createdAt,
      });
    }

    setShowQuickAddSheet(false);
  }

  function handleAddAtCurrentLocation() {
    const coords = gpsCoords ?? {
      latitude: currentCenter.current[1],
      longitude: currentCenter.current[0],
    };
    setAddPlaceState({
      name: '',
      category: 'nature',
      rating: 3,
      description: '',
      coordinates: coords,
    });
    setShowAddModal(true);
  }

  function handleCloseModal() {
    setShowAddModal(false);
  }

  function handleSavePlace() {
    if (!addPlaceState.name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this place.');
      return;
    }
    if (!addPlaceState.coordinates) return;
    addPlace({
      name: addPlaceState.name.trim(),
      description: addPlaceState.description.trim() || undefined,
      coordinates: addPlaceState.coordinates,
      category: addPlaceState.category,
      rating: addPlaceState.rating,
      isFavorite: false,
    });
    setShowAddModal(false);
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
    places,
    profile,
    locationGranted,
    gpsCoords,
    showAddModal,
    showProfileMenu,
    addPlaceState,
    showQuickAddSheet,
    quickAddState,
    searchResultMarkers,
    mutedSearchMarkers,
    toastAnim,
    toastMsg,
    toastGPS,
    currentCenter,
    currentZoom,
    handleCenterGPS,
    handleLongPress,
    handleAddAtCurrentLocation,
    handleCloseModal,
    handleSavePlace,
    handleCloseQuickAddSheet,
    handlePickQuickAddPhotos,
    handleRemoveQuickAddPhoto,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
    setShowProfileMenu,
    setAddPlaceState,
    setQuickAddState,
  };
}
