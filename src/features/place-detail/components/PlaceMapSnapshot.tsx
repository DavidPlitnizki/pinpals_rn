import { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
}

// Memoized on purpose: every keystroke in the name/description fields re-renders the whole
// detail screen, and re-rendering a Mapbox MapView + PointAnnotation re-attaches native views
// — which drops the TextInput's first responder and closes the keyboard mid-typing. Nothing
// here depends on the edit state, so it must not re-render with it.
export const PlaceMapSnapshot = React.memo(function PlaceMapSnapshot({
  id,
  latitude,
  longitude,
  color,
}: Props) {
  const center = useMemo(() => [longitude, latitude], [longitude, latitude]);
  const dotStyle = useMemo(() => [styles.dot, { backgroundColor: color }], [color]);

  return (
    <MapView
      style={styles.map}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      <Camera centerCoordinate={center} zoomLevel={15} animationDuration={0} />
      <PointAnnotation id={id} coordinate={center}>
        <View style={dotStyle} />
      </PointAnnotation>
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: { height: 200, width: '100%' },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
