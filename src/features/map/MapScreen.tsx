import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
  Platform,
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
import { Place, PlaceCategory, Coordinates } from '../../models/types';

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
  const { places, addPlace } = useAppStore();

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPlaceState, setAddPlaceState] = useState<AddPlaceState>({
    name: '',
    category: 'nature',
    rating: 3,
    description: '',
    coordinates: null,
  });

  useEffect(() => {
    requestLocation();
  }, []);

  async function requestLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const loc = await Location.getCurrentPositionAsync({});
        const newRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (e) {
      // Silently fall back to default region
    }
  }

  function handleLongPress(event: LongPressEvent) {
    const { coordinate } = event.nativeEvent;
    setAddPlaceState({
      name: '',
      category: 'nature',
      rating: 3,
      description: '',
      coordinates: coordinate,
    });
    setShowAddModal(true);
  }

  async function handleAddAtCurrentLocation() {
    let coords: Coordinates;
    if (locationPermission) {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      } catch {
        coords = { latitude: region.latitude, longitude: region.longitude };
      }
    } else {
      coords = { latitude: region.latitude, longitude: region.longitude };
    }
    setAddPlaceState({
      name: '',
      category: 'nature',
      rating: 3,
      description: '',
      coordinates: coords,
    });
    setShowAddModal(true);
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

  function handleMarkerCalloutPress(placeId: string) {
    router.push({ pathname: "/place/[id]", params: { id: placeId } } as any);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        onLongPress={handleLongPress}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            pinColor={CATEGORY_COLORS[place.category]}
          >
            <Callout onPress={() => handleMarkerCalloutPress(place.id)} tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                <Text style={styles.calloutCategory}>
                  {CATEGORY_LABELS[place.category]}
                </Text>
                <Text style={styles.calloutRating}>{'★'.repeat(place.rating)}</Text>
                <Text style={styles.calloutTap}>Tap for details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Floating add button */}
      <SafeAreaView style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity style={styles.fab} onPress={handleAddAtCurrentLocation}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Add Place Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Place</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <PinTextField
              label="Name"
              value={addPlaceState.name}
              onChangeText={(text) => setAddPlaceState((s) => ({ ...s, name: text }))}
              placeholder="Place name"
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
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
                onChangeText={(text) => setAddPlaceState((s) => ({ ...s, description: text }))}
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
              <PinButton
                title="Save Place"
                onPress={handleSavePlace}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    alignItems: 'flex-end',
    paddingRight: Spacing.s24,
    paddingBottom: Spacing.s24,
  },
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
  fabText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    fontWeight: '400',
  },
  callout: {
    padding: Spacing.s8,
    minWidth: 140,
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'capitalize',
  },
  calloutRating: {
    fontSize: 14,
    color: '#F5A623',
    marginTop: 2,
  },
  calloutTap: {
    ...Typography.caption,
    color: Colors.brand.primary,
    marginTop: Spacing.s4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
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
  modalTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
  },
  cancelText: {
    ...Typography.body,
    color: Colors.brand.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.s20,
  },
  fieldGroup: {
    marginBottom: Spacing.s16,
  },
  fieldLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.s8,
    paddingVertical: Spacing.s4,
  },
  coordsInfo: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.sm,
    padding: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  coordsText: {
    ...Typography.footnote,
    color: Colors.neutral[600],
  },
  saveButtonContainer: {
    marginTop: Spacing.s8,
    marginBottom: Spacing.s32,
  },
});
