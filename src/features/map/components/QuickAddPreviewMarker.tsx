import { Ionicons } from '@expo/vector-icons';
import { PointAnnotation } from '@rnmapbox/maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../../design-system/tokens';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { Coordinates } from '../../../models/types';

const PIN_SIZE = 40;

interface Props {
  coordinates: Coordinates;
  // Bump this (e.g. with route.pickerVisible) to force the marker to re-register its
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
}

export function QuickAddPreviewMarker({ coordinates, refreshSignal }: Props) {
  const { registerRef } = usePointAnnotationRefresh(refreshSignal);

  return (
    <PointAnnotation
      ref={registerRef('quick-add-preview')}
      id="quick-add-preview"
      coordinate={[coordinates.longitude, coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.pinWrap}>
        <Ionicons name="location-sharp" size={PIN_SIZE} color={Colors.brand.primary} />
        <View style={styles.pinBadge} />
      </View>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Same drop-pin silhouette as SearchResultMarker/NativePoiMarker, in brand green —
  // reads as "your new pin will land here", not as a different kind of object.
  pinBadge: {
    position: 'absolute',
    top: 9,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
});
