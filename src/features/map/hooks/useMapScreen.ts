import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import MapView, { LongPressEvent, Region } from "react-native-maps";

import { Coordinates } from "../../../models/types";
import { useAppStore } from "../../../store/useAppStore";
import {
  DEFAULT_REGION,
  MIN_DELTA,
  MAX_DELTA,
  ZOOM_IN,
  ZOOM_OUT,
} from "../constants";
import { AddPlaceState } from "../types";

export function useMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { places, addPlace, deletePlace, profile } = useAppStore();

  const currentRegion = useRef<Region>(DEFAULT_REGION);

  const [locationGranted, setLocationGranted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<Coordinates | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [addPlaceState, setAddPlaceState] = useState<AddPlaceState>({
    name: "",
    category: "nature",
    rating: 3,
    description: "",
    coordinates: null,
  });

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");
  const [toastGPS, setToastGPS] = useState(false);

  useEffect(() => {
    requestLocation();
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
      if (status !== "granted") {
        showToast("Location permission denied", false);
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
      showToast("Could not get location", false);
    }
  }

  function applyLocation(latitude: number, longitude: number) {
    const coords = { latitude, longitude };
    const newRegion: Region = {
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setGpsCoords(coords);
    currentRegion.current = newRegion;
    mapRef.current?.animateToRegion(newRegion, 800);
    showToast("Centred on your GPS location", true);
  }

  function handleZoomIn() {
    const r = currentRegion.current;
    const delta = Math.max(r.latitudeDelta * ZOOM_IN, MIN_DELTA);
    const next: Region = { ...r, latitudeDelta: delta, longitudeDelta: delta };
    mapRef.current?.animateToRegion(next, 250);
  }

  function handleZoomOut() {
    const r = currentRegion.current;
    const delta = Math.min(r.latitudeDelta * ZOOM_OUT, MAX_DELTA);
    const next: Region = { ...r, latitudeDelta: delta, longitudeDelta: delta };
    mapRef.current?.animateToRegion(next, 250);
  }

  function handleCenterGPS() {
    if (!gpsCoords) return;
    const next: Region = {
      ...gpsCoords,
      latitudeDelta: currentRegion.current.latitudeDelta,
      longitudeDelta: currentRegion.current.longitudeDelta,
    };
    mapRef.current?.animateToRegion(next, 600);
  }

  function handleLongPress(event: LongPressEvent) {
    const { coordinate } = event.nativeEvent;
    mapRef.current?.animateToRegion(
      {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: currentRegion.current.latitudeDelta,
        longitudeDelta: currentRegion.current.longitudeDelta,
      },
      600,
    );
    addPlace({
      name: `Pin ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      coordinates: coordinate,
      category: "nature",
      rating: 3,
      isFavorite: false,
    });
  }

  function handleAddAtCurrentLocation() {
    const coords = gpsCoords ?? {
      latitude: currentRegion.current.latitude,
      longitude: currentRegion.current.longitude,
    };
    setAddPlaceState({
      name: "",
      category: "nature",
      rating: 3,
      description: "",
      coordinates: coords,
    });
    setShowAddModal(true);
  }

  function handleCloseModal() {
    setShowAddModal(false);
  }

  function handleSavePlace() {
    if (!addPlaceState.name.trim()) {
      Alert.alert("Name required", "Please enter a name for this place.");
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
    router.push({ pathname: "/place/[id]", params: { id: placeId } } as any);
  }

  function handleDeleteMarker(placeId: string, placeName: string) {
    Alert.alert("Delete place", `Remove "${placeName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlace(placeId),
      },
    ]);
  }

  return {
    mapRef,
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
    currentRegion,
    handleZoomIn,
    handleZoomOut,
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
