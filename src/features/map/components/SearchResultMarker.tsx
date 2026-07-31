import { Ionicons } from '@expo/vector-icons';
import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { PendingSearchMarker } from '../types';
import { iconForMaki } from '../utils/mapboxIcons';

const PIN_SIZE = 40;
const DROP_RED = '#E4483C';

interface Props {
  markers: PendingSearchMarker[];
  onConfirm: (marker: PendingSearchMarker) => void;
  onDirections: (marker: PendingSearchMarker) => void;
  // Bump this (e.g. with route.pickerVisible) to force markers to re-register their
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
  // Called when one of these annotations is selected, so the base MapView's onPress
  // (which also fires on this tap) can skip querying for a native basemap POI underneath.
  onAnnotationSelected?: () => void;
}

export function SearchResultMarker({
  markers,
  onConfirm,
  onDirections,
  refreshSignal,
  onAnnotationSelected,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = markers.find((m) => m.id === selectedId) ?? null;
  const registerRef = usePointAnnotationRefresh(refreshSignal);

  return (
    <>
      {markers.map((marker) => (
        <PointAnnotation
          key={marker.id}
          ref={registerRef(marker.id)}
          id={marker.id}
          coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
          anchor={{ x: 0.5, y: 1 }}
          onSelected={() => {
            setSelectedId(marker.id);
            onAnnotationSelected?.();
          }}
          onDeselected={() => setSelectedId((id) => (id === marker.id ? null : id))}
        >
          <View style={styles.markerColumn}>
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText} numberOfLines={1}>
                {marker.name}
              </Text>
            </View>
            <View style={styles.pinWrap}>
              <Ionicons name="location-sharp" size={PIN_SIZE} color={DROP_RED} />
              <View style={styles.iconBadge}>
                <Ionicons name={iconForMaki(marker.maki)} size={12} color={DROP_RED} />
              </View>
            </View>
          </View>
        </PointAnnotation>
      ))}

      {selected && (
        <MarkerView
          coordinate={[selected.coordinates.longitude, selected.coordinates.latitude]}
          anchor={{ x: 0.5, y: 1.4 }}
        >
          <View style={styles.callout}>
            <View style={styles.calloutImageWrap}>
              {selected.imageUrl ? (
                <Image source={{ uri: selected.imageUrl }} style={styles.calloutImage} />
              ) : (
                <View style={styles.calloutImagePlaceholder}>
                  <Ionicons name={iconForMaki(selected.maki)} size={26} color={Colors.neutral[400]} />
                </View>
              )}
            </View>

            <View style={styles.calloutBody}>
              <Text style={styles.calloutName} numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.category && (
                <Text style={styles.calloutCategory}>{selected.category}</Text>
              )}
              {selected.fullAddress && (
                <Text style={styles.calloutAddress} numberOfLines={2}>
                  {selected.fullAddress}
                </Text>
              )}
              {selected.website && (
                <TouchableOpacity onPress={() => Linking.openURL(selected.website!)}>
                  <Text style={styles.calloutWebsite} numberOfLines={1}>
                    {selected.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => {
                  setSelectedId(null);
                  onDirections(selected);
                }}
              >
                <Text style={styles.directionsButtonText}>Directions</Text>
              </TouchableOpacity>
              <View style={styles.calloutActions}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedId(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setSelectedId(null);
                    onConfirm(selected);
                  }}
                >
                  <Text style={styles.addButtonText}>Add place</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MarkerView>
      )}
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutImageWrap: {
    alignItems: 'center',
    paddingTop: Spacing.s12,
  },
  calloutImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  calloutImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutBody: {
    padding: Spacing.s12,
    alignItems: 'center',
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.brand.primary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  calloutAddress: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  calloutWebsite: {
    ...Typography.caption,
    color: Colors.brand.primary,
    marginTop: 4,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
  calloutActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s8,
    marginTop: Spacing.s8,
  },
  closeButton: {
    flex: 1,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.caption,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
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
