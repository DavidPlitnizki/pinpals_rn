import React from 'react';
import { StyleSheet, Text } from 'react-native';

// Mapbox's terms require Static Images API results to carry the same credit the live map's
// own attribution control shows — "cite it as you would a photograph", near the image. The
// live MapView renders that control itself, so this is only for map crops shown as plain
// <Image>s (place covers, callout thumbnails), where nothing else credits the source.
export function MapDataAttribution() {
  return (
    <Text style={styles.text} numberOfLines={1}>
      © Mapbox © OpenStreetMap
    </Text>
  );
}

const styles = StyleSheet.create({
  // Sits over the bottom edge of the image it credits — a translucent scrim rather than a
  // solid bar, so it stays legible on both light and dark map crops without boxing them in.
  text: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 8,
    lineHeight: 11,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
