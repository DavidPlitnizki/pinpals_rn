import { Ionicons } from '@expo/vector-icons';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { PlaceFlagBadges } from '../../../design-system/components/PlaceFlags';
import { Colors, Spacing, Typography } from '../../../design-system/tokens';
import { MemoryMood, MOOD_CONFIG, Place } from '../../../models/types';
import { categoryColor, categoryIcon } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { iconForMaki } from '../../map/utils/mapboxIcons';
import { getPlacePhotoPreview, PlacePhotoPreview } from '../../map/utils/placePhoto';
import { MiniMapPlaceSheet } from './MiniMapPlaceSheet';

interface Props {
  places: Place[];
}

const DEFAULT_CENTER: [number, number] = [-73.9857, 40.7484];
const PIN_SIZE = 46;

function getPinColor(
  place: Place,
  getLatestMoodForPlace: (placeId: string) => MemoryMood | undefined,
): string {
  const mood = getLatestMoodForPlace(place.id);
  return mood ? MOOD_CONFIG[mood].color : (place.pinColor ?? categoryColor(place.category));
}

interface MiniMapPinProps {
  place: Place;
  color: string;
  preview: PlacePhotoPreview | null;
  onSelect: (id: string) => void;
}

// Deliberately the same silhouette as the main map's pins — a name label above a drop, with
// the place's photo set into the drop's wide end. Two maps of the same places that drew them
// differently just looked like two unrelated features.
const MiniMapPin = React.memo(function MiniMapPin({
  place,
  color,
  preview,
  onSelect,
}: MiniMapPinProps) {
  const handleSelected = useCallback(() => onSelect(place.id), [onSelect, place.id]);

  return (
    <PointAnnotation
      id={`mini-${place.id}`}
      coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      onSelected={handleSelected}
    >
      <View style={styles.markerColumn}>
        <View style={styles.markerLabel}>
          <PlaceFlagBadges favorite={place.favorite} wantToVisit={place.isFavorite} size={11} />
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {place.name}
          </Text>
        </View>
        <View style={styles.pinWrap}>
          <Ionicons name="location-sharp" size={PIN_SIZE} color={color} />
          {preview ? (
            <View style={styles.photoBadge}>
              <Image source={{ uri: preview.photoUri }} style={styles.photoBadgeImage} />
            </View>
          ) : (
            <View style={styles.pinBadge}>
              <Ionicons
                name={place.maki ? iconForMaki(place.maki) : categoryIcon(place.category)}
                size={14}
                color={categoryColor(place.category)}
              />
            </View>
          )}
        </View>
      </View>
    </PointAnnotation>
  );
});

export function PlacesMiniMap({ places }: Props) {
  const router = useRouter();
  const notes = usePlacesStore((s) => s.notes);
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const selectedPlace = places.find((p) => p.id === selectedId) ?? null;

  // Computed once per places/notes change instead of inside each pin's render, so selecting a
  // pin doesn't re-scan every place's notes for a photo.
  const previews = useMemo(() => {
    const map = new Map<string, PlacePhotoPreview | null>();
    for (const place of places) map.set(place.id, getPlacePhotoPreview(place, notes));
    return map;
  }, [places, notes]);

  // Memoized for identity, not for the arithmetic: a fresh array on every render hands Camera
  // a "new" centre each time the selection changes, which re-seats the map and undoes any
  // panning the user did before tapping a pin.
  const centerCoordinate = useMemo<[number, number]>(
    () =>
      places.length > 0
        ? [
            places.reduce((sum, p) => sum + p.coordinates.longitude, 0) / places.length,
            places.reduce((sum, p) => sum + p.coordinates.latitude, 0) / places.length,
          ]
        : DEFAULT_CENTER,
    [places],
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  }, []);

  const handleCloseSheet = useCallback(() => setSelectedId(null), []);

  const handleOpenSelectedPlace = useCallback(() => {
    if (!selectedPlace) return;
    const id = selectedPlace.id;
    setSelectedId(null);
    router.push({ pathname: '/place/[id]', params: { id } } as any);
  }, [router, selectedPlace]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerSize && (
        <MapView
          styleURL={Mapbox.StyleURL.Street}
          style={containerSize}
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
        >
          <Camera centerCoordinate={centerCoordinate} zoomLevel={11} animationDuration={0} />
          {places.map((place) => (
            <MiniMapPin
              key={place.id}
              place={place}
              color={getPinColor(place, getLatestMoodForPlace)}
              preview={previews.get(place.id) ?? null}
              onSelect={setSelectedId}
            />
          ))}
        </MapView>
      )}

      {/* A sheet rather than an on-map callout: a MarkerView is a child of the native map and
          can't be lifted above anything, and the old callout only had room for a name. */}
      <MiniMapPlaceSheet
        place={selectedPlace}
        preview={selectedPlace ? (previews.get(selectedPlace.id) ?? null) : null}
        onOpenDetails={handleOpenSelectedPlace}
        onClose={handleCloseSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerColumn: {
    alignItems: 'center',
  },
  markerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    maxWidth: 140,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s2,
    marginBottom: Spacing.s4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    ...Typography.caption,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  pinWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    position: 'absolute',
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    top: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  photoBadgeImage: {
    width: '100%',
    height: '100%',
  },
});
