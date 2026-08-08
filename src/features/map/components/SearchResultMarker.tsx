import { Ionicons } from '@expo/vector-icons';
import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { PendingSearchMarker } from '../types';
import { iconForMaki } from '../utils/mapboxIcons';
import { CalloutActionButton } from './CalloutActionButton';

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
  // Bumped whenever the user taps empty map space (or a different POI) — closes this
  // marker's open callout the same way tapping a different annotation would.
  dismissSignal?: unknown;
}

interface MarkerPinProps {
  marker: PendingSearchMarker;
  registerRef: (id: string) => (ref: PointAnnotation | null) => void;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

// Isolated from SearchResultMarker's own re-renders (e.g. opening/closing the callout) so
// unrelated markers in the list don't have to re-evaluate their JSX on every selection change.
const MarkerPin = React.memo(function MarkerPin({
  marker,
  registerRef,
  onSelect,
  onDeselect,
}: MarkerPinProps) {
  const handleSelected = useCallback(() => onSelect(marker.id), [onSelect, marker.id]);
  const handleDeselected = useCallback(() => onDeselect(marker.id), [onDeselect, marker.id]);

  return (
    <PointAnnotation
      ref={registerRef(marker.id)}
      id={marker.id}
      coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      onSelected={handleSelected}
      onDeselected={handleDeselected}
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
  );
});

export function SearchResultMarker({
  markers,
  onConfirm,
  onDirections,
  refreshSignal,
  onAnnotationSelected,
  dismissSignal,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = markers.find((m) => m.id === selectedId) ?? null;
  const { registerRef } = usePointAnnotationRefresh(refreshSignal);

  // Adjust state during render (React's documented pattern for "reset on prop change")
  // rather than in a useEffect — see MapMarkers' identical dismissSignal handling.
  const prevDismissSignalRef = useRef(dismissSignal);
  if (dismissSignal !== prevDismissSignalRef.current) {
    prevDismissSignalRef.current = dismissSignal;
    if (selectedId !== null) setSelectedId(null);
  }

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onAnnotationSelected?.();
    },
    [onAnnotationSelected],
  );

  const handleDeselect = useCallback((id: string) => {
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleCloseCallout = useCallback(() => setSelectedId(null), []);

  const handleWebsitePress = useCallback(() => {
    if (selected?.website) Linking.openURL(selected.website);
  }, [selected]);

  const handleDirectionsPress = useCallback(() => {
    if (!selected) return;
    setSelectedId(null);
    onDirections(selected);
  }, [onDirections, selected]);

  const handleConfirmPress = useCallback(() => {
    if (!selected) return;
    setSelectedId(null);
    onConfirm(selected);
  }, [onConfirm, selected]);

  return (
    <>
      {markers.map((marker) => (
        <MarkerPin
          key={marker.id}
          marker={marker}
          registerRef={registerRef}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      ))}

      {selected && (
        <MarkerView
          coordinate={[selected.coordinates.longitude, selected.coordinates.latitude]}
          anchor={{ x: 0.5, y: 1.4 }}
        >
          <View style={styles.callout}>
            <View style={styles.calloutHeaderRow}>
              <CircleCloseButton onPress={handleCloseCallout} style={styles.calloutCloseButton} />
            </View>
            <View style={styles.calloutImageWrap}>
              {selected.imageUrl ? (
                <Image source={{ uri: selected.imageUrl }} style={styles.calloutImage} />
              ) : (
                <View style={styles.calloutImagePlaceholder}>
                  <Ionicons
                    name={iconForMaki(selected.maki)}
                    size={26}
                    color={Colors.neutral[400]}
                  />
                </View>
              )}
            </View>

            <View style={styles.calloutBody}>
              <Text style={styles.calloutName} numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.category && <Text style={styles.calloutCategory}>{selected.category}</Text>}
              {selected.fullAddress && (
                <Text style={styles.calloutAddress} numberOfLines={2}>
                  {selected.fullAddress}
                </Text>
              )}
              {selected.website && (
                <TouchableOpacity onPress={handleWebsitePress}>
                  <Text style={styles.calloutWebsite} numberOfLines={1}>
                    {selected.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.calloutActionsRow}>
                <CalloutActionButton
                  icon="navigate-outline"
                  iconSize={24}
                  iconColor={Colors.brand.primary}
                  backgroundColor={Colors.brand.light}
                  borderColor={Colors.brand.primary}
                  onPress={handleDirectionsPress}
                />
                <CalloutActionButton
                  icon="add-circle-outline"
                  iconSize={24}
                  iconColor={Colors.accent.primary}
                  backgroundColor={Colors.accent.light}
                  borderColor={Colors.accent.primary}
                  onPress={handleConfirmPress}
                />
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
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // A normal in-flow row, not an absolutely-positioned overlay — MarkerView measures/
  // rasterizes its content to the JS-measured layout box, so anything positioned outside
  // that box (negative offsets, or content clipped by a parent's overflow) gets cut off
  // rather than floating over the map. Keeping the button in flow avoids both.
  calloutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.s8,
    paddingRight: Spacing.s8,
  },
  // A dark border keeps the button visible against whatever's under it on the map,
  // instead of blending into busy map tiles.
  calloutCloseButton: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[900],
  },
  calloutImageWrap: {
    alignItems: 'center',
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
  // Matches the neutral (not brand-green) category color used by MapMarkers' and
  // NativePoiMarker's callouts — brand-primary here would visually compete with the
  // "Directions" button below, which is the one green/brand-colored element per callout.
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calloutAddress: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
    textAlign: 'center',
  },
  calloutWebsite: {
    ...Typography.caption,
    color: Colors.brand.primary,
    marginTop: Spacing.s4,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  calloutActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s8,
    marginTop: Spacing.s12,
  },
});
