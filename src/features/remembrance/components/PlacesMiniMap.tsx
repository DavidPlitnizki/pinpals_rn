import Mapbox, { Camera, MapView, MarkerView, PointAnnotation } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MOOD_CONFIG, Place } from '../../../models/types';
import { CATEGORY_COLORS } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';

interface Props {
  places: Place[];
}

const DEFAULT_CENTER: [number, number] = [-73.9857, 40.7484];

export function PlacesMiniMap({ places }: Props) {
  const router = useRouter();
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const selectedPlace = places.find((p) => p.id === selectedId);

  const centerCoordinate: [number, number] =
    places.length > 0
      ? [
          places.reduce((sum, p) => sum + p.coordinates.longitude, 0) / places.length,
          places.reduce((sum, p) => sum + p.coordinates.latitude, 0) / places.length,
        ]
      : DEFAULT_CENTER;

  function getPinColor(place: Place): string {
    const mood = getLatestMoodForPlace(place.id);
    return mood ? MOOD_CONFIG[mood].color : CATEGORY_COLORS[place.category];
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) =>
        setContainerSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
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
            <PointAnnotation
              key={place.id}
              id={`mini-${place.id}`}
              coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
              onSelected={() => setSelectedId(place.id)}
              onDeselected={() => setSelectedId(null)}
            >
              <View style={[styles.pin, { backgroundColor: getPinColor(place) }]} />
            </PointAnnotation>
          ))}
          {selectedPlace && (
            <MarkerView
              coordinate={[
                selectedPlace.coordinates.longitude,
                selectedPlace.coordinates.latitude,
              ]}
              anchor={{ x: 0.5, y: 1.3 }}
            >
              <TouchableOpacity
                style={styles.callout}
                onPress={() =>
                  router.push({
                    pathname: '/place/[id]',
                    params: { id: selectedPlace.id },
                  } as any)
                }
              >
                <Text style={styles.calloutName}>{selectedPlace.name}</Text>
                <Text style={styles.calloutHint}>Подробнее →</Text>
              </TouchableOpacity>
            </MarkerView>
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 130,
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  calloutHint: {
    ...Typography.caption,
    color: Colors.brand.primary,
  },
});
