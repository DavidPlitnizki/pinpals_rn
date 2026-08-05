import { Ionicons } from '@expo/vector-icons';
import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { HIT_SLOP_8 } from '../constants';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { NativePoiMarker as NativePoiMarkerData } from '../types';
import { iconForMaki } from '../utils/mapboxIcons';

const PIN_SIZE = 40;
// Distinct from CATEGORY_COLORS (food/coffee/nature/art/sports), SearchResultMarker's
// DROP_RED and ROUTE_LINE_COLOR — reads as "basemap data", not user/app data. Reuses the
// `warning` design token rather than a new hardcoded hex.
const POI_COLOR = Colors.warning;

interface Props {
  marker: NativePoiMarkerData;
  onClose: () => void;
  onDirections: (marker: NativePoiMarkerData) => void;
  onAddPlace: (marker: NativePoiMarkerData) => void;
  // Bump this (e.g. with route.pickerVisible) to force the marker to re-register its
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
  // Called when this annotation is selected, so the base MapView's onPress (which also
  // fires on this tap) can skip re-querying for a native basemap POI underneath.
  onAnnotationSelected?: () => void;
}

export function NativePoiMarker({
  marker,
  onClose,
  onDirections,
  onAddPlace,
  refreshSignal,
  onAnnotationSelected,
}: Props) {
  const { registerRef } = usePointAnnotationRefresh(refreshSignal);

  const handleSelected = useCallback(() => onAnnotationSelected?.(), [onAnnotationSelected]);
  const handleDirectionsPress = useCallback(() => onDirections(marker), [onDirections, marker]);
  const handleAddPlacePress = useCallback(() => onAddPlace(marker), [onAddPlace, marker]);

  return (
    <>
      <PointAnnotation
        key={marker.id}
        ref={registerRef(marker.id)}
        id={marker.id}
        coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
        anchor={{ x: 0.5, y: 1 }}
        onSelected={handleSelected}
      >
        <View style={styles.markerColumn}>
          <View style={styles.markerLabel}>
            <Text style={styles.markerLabelText} numberOfLines={1}>
              {marker.name}
            </Text>
          </View>
          <View style={styles.pinWrap}>
            <Ionicons name="location-sharp" size={PIN_SIZE} color={POI_COLOR} />
            <View style={styles.iconBadge}>
              <Ionicons name={iconForMaki(marker.maki)} size={12} color={POI_COLOR} />
            </View>
          </View>
        </View>
      </PointAnnotation>

      <MarkerView
        coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
        anchor={{ x: 0.5, y: 1.4 }}
      >
        <View style={styles.callout}>
          <CircleCloseButton onPress={onClose} style={styles.calloutCloseButton} />
          <Text style={styles.calloutName} numberOfLines={1}>
            {marker.name}
          </Text>
          {marker.category && <Text style={styles.calloutCategory}>{marker.category}</Text>}

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={handleDirectionsPress}
            hitSlop={HIT_SLOP_8}
          >
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPlacePress}
            hitSlop={HIT_SLOP_8}
          >
            <Text style={styles.addButtonText}>Add place</Text>
          </TouchableOpacity>
        </View>
      </MarkerView>
    </>
  );
}

const styles = StyleSheet.create({
  markerColumn: {
    alignItems: 'center',
  },
  markerLabel: {
    maxWidth: 120,
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
  iconBadge: {
    position: 'absolute',
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    minWidth: 200,
    maxWidth: 240,
    padding: Spacing.s12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutCloseButton: {
    position: 'absolute',
    top: Spacing.s4,
    right: Spacing.s4,
    zIndex: 1,
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  directionsButton: {
    width: '100%',
    marginTop: Spacing.s12,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    alignItems: 'center',
  },
  directionsButtonText: {
    ...Typography.caption,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  addButton: {
    width: '100%',
    marginTop: Spacing.s8,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
});
