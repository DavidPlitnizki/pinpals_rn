import { Camera } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';

import { Coordinates } from '../../../models/types';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import { AddPlaceState } from '../types';

export function useMapScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const { places, addPlace, deletePlace } = usePlacesStore();
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
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: currentZoom.current,
      animationDuration: 600,
    });
    addPlace({
      name: `Pin ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      coordinates: { latitude, longitude },
      category: 'nature',
      rating: 3,
      isFavorite: false,
    });
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
    handleMarkerPress,
    handleDeleteMarker,
    setShowProfileMenu,
    setAddPlaceState,
  };
}
