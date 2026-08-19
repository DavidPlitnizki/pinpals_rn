import { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  // Lets the hero gallery match its page height; defaults to the standalone header height.
  height?: number;
  // Full-screen presentation wants a map the user can actually pan and zoom.
  interactive?: boolean;
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
  height,
  interactive = false,
}: Props) {
  const center = useMemo(() => [longitude, latitude], [longitude, latitude]);
  const dotStyle = useMemo(() => [styles.dot, { backgroundColor: color }], [color]);
  const mapStyle = useMemo(
    () => (height === undefined ? styles.map : [styles.map, { height }]),
    [height],
  );

  return (
    <MapView
      style={mapStyle}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
    >
      <Camera centerCoordinate={center} zoomLevel={15} animationDuration={0} />
      <PointAnnotation id={id} coordinate={center}>
        <View style={dotStyle} />
      </PointAnnotation>
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: { height: 200, width: '100%', flex: 1 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
