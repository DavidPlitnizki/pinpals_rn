import { PointAnnotation } from '@rnmapbox/maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../../design-system/tokens';
import { PendingSearchMarker } from '../types';

interface Props {
  markers: PendingSearchMarker[];
}

export function MutedSearchMarker({ markers }: Props) {
  return (
    <>
      {markers.map((marker) => (
        <PointAnnotation
          key={`muted-${marker.id}`}
          id={`muted-${marker.id}`}
          coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
        >
          <View style={styles.pin} />
        </PointAnnotation>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.neutral[400],
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
