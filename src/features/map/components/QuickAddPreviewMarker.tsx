import { Ionicons } from '@expo/vector-icons';
import { PointAnnotation } from '@rnmapbox/maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../../design-system/tokens';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { Coordinates } from '../../../models/types';

interface Props {
  coordinates: Coordinates;
  // Bump this (e.g. with route.pickerVisible) to force the marker to re-register its
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
}

export function QuickAddPreviewMarker({ coordinates, refreshSignal }: Props) {
  const registerRef = usePointAnnotationRefresh(refreshSignal);

  return (
    <PointAnnotation
      ref={registerRef('quick-add-preview')}
      id="quick-add-preview"
      coordinate={[coordinates.longitude, coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.flagWrap}>
        <Ionicons name="flag" size={30} color={Colors.brand.primary} />
      </View>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  flagWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
