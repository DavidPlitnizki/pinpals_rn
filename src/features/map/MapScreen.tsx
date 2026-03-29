import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Image,
} from 'react-native';
import MapView, { Marker, Callout, LongPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinButton } from '../../design-system/components/PinButton';
import { PinTextField } from '../../design-system/components/PinTextField';
import { PinRatingView } from '../../design-system/components/PinRatingView';
import { PinChip } from '../../design-system/components/PinChip';
import { Coordinates, PlaceCategory } from '../../models/types';

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: '#E8834A',
  coffee: '#8B6347',
  nature: '#4A7C59',
  art: '#9C6ADE',
  sports: '#3D9BE9',
};

const CATEGORIES: PlaceCategory[] = ['food', 'nature', 'art', 'sports', 'coffee'];
const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

const DEFAULT_REGION: Region = {
  latitude: 40.785091,
  longitude: -73.968285,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ZOOM_IN = 0.5;
const ZOOM_OUT = 2;
const MIN_DELTA = 0.0005;
const MAX_DELTA = 80;

interface AddPlaceState {
  name: string;
  category: PlaceCategory;
  rating: number;
  description: string;
  coordinates: Coordinates | null;
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { places, addPlace, deletePlace, profile } = useAppStore();

  // Track current region in a ref to avoid re-renders on every pan
  const currentRegion = useRef<Region>(DEFAULT_REGION);

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

  // Toast
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastGPS, setToastGPS] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  function showToast(msg: string, isGPS: boolean) {
    setToastMsg(msg);
    setToastGPS(isGPS);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
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

      // Try last known position first for instant response
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        applyLocation(last.coords.latitude, last.coords.longitude);
      }

      // Then get accurate current position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      applyLocation(loc.coords.latitude, loc.coords.longitude);
    } catch (e: any) {
      showToast('Could not get location', false);
    }
  }

  function applyLocation(latitude: number, longitude: number) {
    const coords = { latitude, longitude };
    const newRegion: Region = { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    setGpsCoords(coords);
    currentRegion.current = newRegion;
    mapRef.current?.animateToRegion(newRegion, 800);
    showToast('Centred on your GPS location', true);
  }

  // ── Zoom & GPS center ────────────────────────────────────────────────────────

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

  // ── Long press ───────────────────────────────────────────────────────────────

  function handleLongPress(event: LongPressEvent) {
    const { coordinate } = event.nativeEvent;
    mapRef.current?.animateToRegion(
      {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: currentRegion.current.latitudeDelta,
        longitudeDelta: currentRegion.current.longitudeDelta,
      },
      600
    );
    addPlace({
      name: `Pin ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      coordinates: coordinate,
      category: 'nature',
      rating: 3,
      isFavorite: false,
    });
  }

  // ── Add place ────────────────────────────────────────────────────────────────

  function handleAddAtCurrentLocation() {
    const coords = gpsCoords ?? {
      latitude: currentRegion.current.latitude,
      longitude: currentRegion.current.longitude,
    };
    setAddPlaceState({ name: '', category: 'nature', rating: 3, description: '', coordinates: coords });
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
      { text: 'Delete', style: 'destructive', onPress: () => deletePlace(placeId) },
    ]);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toastTranslateY = toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });

  function getInitials(name: string) {
    return name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={(r) => { currentRegion.current = r; }}
        onLongPress={handleLongPress}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            pinColor={CATEGORY_COLORS[place.category]}
          >
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <TouchableOpacity onPress={() => handleMarkerPress(place.id)}>
                  <Text style={styles.calloutName}>{place.name}</Text>
                  <Text style={styles.calloutCategory}>{CATEGORY_LABELS[place.category]}</Text>
                  <Text style={styles.calloutRating}>{'★'.repeat(place.rating)}</Text>
                  <Text style={styles.calloutTap}>Tap for details →</Text>
                </TouchableOpacity>
                <View style={styles.calloutDivider} />
                <TouchableOpacity onPress={() => handleDeleteMarker(place.id, place.name)}>
                  <Text style={styles.calloutDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

      </MapView>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          toastGPS ? styles.toastGPS : styles.toastDefault,
          { opacity: toastAnim, transform: [{ translateY: toastTranslateY }] },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      {/* Profile button — top right */}
      <SafeAreaView style={styles.profileBtnWrap} pointerEvents="box-none">
        <TouchableOpacity style={styles.profileBtn} onPress={() => setShowProfileMenu(true)}>
          {profile.avatarUri ? (
            <Image source={{ uri: profile.avatarUri }} style={styles.profileBtnAvatar} />
          ) : (
            <Text style={styles.profileBtnInitials}>{getInitials(profile.name)}</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom-right cluster: zoom controls + GPS + FAB */}
      <SafeAreaView style={styles.bottomRightWrap} pointerEvents="box-none">
        <View style={styles.bottomRightCluster}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn}>
              <Text style={styles.controlIcon}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut}>
              <Text style={styles.controlIcon}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, !gpsCoords && styles.controlBtnDisabled]}
              onPress={handleCenterGPS}
              disabled={!gpsCoords}
            >
              <Text style={[styles.controlIcon, !gpsCoords && styles.controlIconDisabled]}>◎</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.fab} onPress={handleAddAtCurrentLocation}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Profile Menu Sheet ── */}
      <Modal
        visible={showProfileMenu}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <SafeAreaView style={styles.sheetContainer} edges={['top', 'bottom']}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Account</Text>
            <TouchableOpacity onPress={() => setShowProfileMenu(false)}>
              <Text style={styles.sheetDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sheetContent}>
            <View style={styles.sheetAvatarRow}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.sheetAvatar} />
              ) : (
                <View style={styles.sheetAvatarPlaceholder}>
                  <Text style={styles.sheetAvatarInitials}>{getInitials(profile.name)}</Text>
                </View>
              )}
              <View style={styles.sheetNameCol}>
                <Text style={styles.sheetName}>{profile.name}</Text>
                {!!profile.bio && (
                  <Text style={styles.sheetBio} numberOfLines={2}>{profile.bio}</Text>
                )}
              </View>
            </View>

            <View style={styles.sheetStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{places.length}</Text>
                <Text style={styles.statLbl}>Places</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{places.filter((p) => p.isFavorite).length}</Text>
                <Text style={styles.statLbl}>Favorites</Text>
              </View>
            </View>

            <PinButton
              title="View Full Profile"
              fullWidth
              onPress={() => {
                setShowProfileMenu(false);
                router.push('/(tabs)/profile' as any);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Add Place Modal ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Place</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <PinTextField
              label="Name"
              value={addPlaceState.name}
              onChangeText={(t) => setAddPlaceState((s) => ({ ...s, name: t }))}
              placeholder="Place name"
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <PinChip
                    key={cat}
                    label={CATEGORY_LABELS[cat]}
                    color={CATEGORY_COLORS[cat]}
                    selected={addPlaceState.category === cat}
                    onPress={() => setAddPlaceState((s) => ({ ...s, category: cat }))}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rating</Text>
              <PinRatingView
                rating={addPlaceState.rating}
                onRatingChange={(r) => setAddPlaceState((s) => ({ ...s, rating: r }))}
                size={28}
              />
            </View>

            <View style={styles.fieldGroup}>
              <PinTextField
                label="Description (optional)"
                value={addPlaceState.description}
                onChangeText={(t) => setAddPlaceState((s) => ({ ...s, description: t }))}
                placeholder="What's special about this place?"
                multiline
              />
            </View>

            {addPlaceState.coordinates && (
              <View style={styles.coordsInfo}>
                <Text style={styles.coordsText}>
                  📍 {addPlaceState.coordinates.latitude.toFixed(4)},{' '}
                  {addPlaceState.coordinates.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            <View style={styles.saveButtonContainer}>
              <PinButton title="Save Place" onPress={handleSavePlace} fullWidth size="lg" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const controlBtnBase = {
  width: 44,
  height: 44,
  borderRadius: Radii.md,
  backgroundColor: Colors.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastGPS: { backgroundColor: Colors.brand.primary },
  toastDefault: { backgroundColor: Colors.neutral[700] },
  toastText: { ...Typography.footnote, color: Colors.white, fontWeight: '600' },

  // Profile button — top right
  profileBtnWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: Spacing.s16,
    paddingRight: Spacing.s16,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  profileBtnAvatar: { width: 44, height: 44 },
  profileBtnInitials: { ...Typography.subheadline, color: Colors.white, fontWeight: '700' },

  // Bottom-right cluster: zoom + GPS + FAB
  bottomRightWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24,
    paddingRight: Spacing.s16,
  },
  bottomRightCluster: {
    alignItems: 'center',
    gap: Spacing.s12,
  },
  controls: { gap: Spacing.s8, alignItems: 'center' },
  controlBtn: controlBtnBase,
  controlBtnDisabled: { opacity: 0.35 },
  controlIcon: { fontSize: 22, color: Colors.neutral[800], lineHeight: 26 },
  controlIconDisabled: { color: Colors.neutral[400] },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: Colors.white, lineHeight: 32, fontWeight: '400' },

  // Callout
  callout: { padding: Spacing.s8, minWidth: 150 },
  calloutName: { ...Typography.headline, color: Colors.neutral[900], marginBottom: 2 },
  calloutCategory: { ...Typography.caption, color: Colors.neutral[500], textTransform: 'capitalize' },
  calloutRating: { fontSize: 14, color: '#F5A623', marginTop: 2 },
  calloutTap: { ...Typography.caption, color: Colors.brand.primary, marginTop: Spacing.s4 },
  calloutDivider: { height: 1, backgroundColor: Colors.neutral[100], marginVertical: Spacing.s8 },
  calloutDelete: { ...Typography.caption, color: Colors.error, fontWeight: '600', textAlign: 'center' },

  // Profile sheet
  sheetContainer: { flex: 1, backgroundColor: Colors.neutral[50] },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  sheetTitle: { ...Typography.title3, color: Colors.neutral[900] },
  sheetDone: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
  sheetContent: { padding: Spacing.s20, gap: Spacing.s20 },
  sheetAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s16 },
  sheetAvatar: { width: 64, height: 64, borderRadius: 32 },
  sheetAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarInitials: { fontSize: 24, fontWeight: '700', color: Colors.white },
  sheetNameCol: { flex: 1 },
  sheetName: { ...Typography.title3, color: Colors.neutral[900], marginBottom: Spacing.s4 },
  sheetBio: { ...Typography.subheadline, color: Colors.neutral[500] },
  sheetStats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...Typography.title2, color: Colors.brand.primary, marginBottom: Spacing.s4 },
  statLbl: { ...Typography.caption, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.neutral[100] },

  // Add place modal
  modalContainer: { flex: 1, backgroundColor: Colors.neutral[50] },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  modalTitle: { ...Typography.title3, color: Colors.neutral[900] },
  cancelText: { ...Typography.body, color: Colors.brand.primary },
  modalContent: { flex: 1, padding: Spacing.s20 },
  fieldGroup: { marginBottom: Spacing.s16 },
  fieldLabel: { ...Typography.subheadline, color: Colors.neutral[700], marginBottom: Spacing.s8, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: Spacing.s8, paddingVertical: Spacing.s4 },
  coordsInfo: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.sm,
    padding: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  coordsText: { ...Typography.footnote, color: Colors.neutral[600] },
  saveButtonContainer: { marginTop: Spacing.s8, marginBottom: Spacing.s32 },
});
