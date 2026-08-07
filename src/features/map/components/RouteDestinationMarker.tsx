import { Ionicons } from '@expo/vector-icons';
import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { HIT_SLOP_8 } from '../constants';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { RouteWaypoint } from '../types';

const PIN_SIZE = 40;
// Distinct from every other marker color on the map (turquoise = my places, red = search
// results, amber = native POI, blue = route line) — reused from the "fastest mode" badge in
// RouteModePicker so it reads as "part of the routing feature".
const DESTINATION_COLOR = Colors.accent.primary;

interface Props {
  waypoints: RouteWaypoint[];
  // Bump this (e.g. when a Modal opens/closes) to force the markers to re-register their
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
  // Called when one of these annotations is selected, so the base MapView's onPress
  // (which also fires on this tap) can skip querying for a native basemap POI underneath.
  onAnnotationSelected?: () => void;
  // Bumped whenever the user taps empty map space (or a different marker) — closes this
  // marker's open callout the same way tapping a different annotation would.
  dismissSignal?: unknown;
  onSaveRoute: () => void;
  onSavePoint: (waypoint: RouteWaypoint) => void;
}

interface MarkerPinProps {
  id: string;
  waypoint: RouteWaypoint;
  registerRef: (id: string) => (ref: PointAnnotation | null) => void;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

// Isolated from RouteDestinationMarker's own re-renders (e.g. opening/closing the callout)
// so unrelated stops in the list don't have to re-evaluate their JSX on every selection change.
const MarkerPin = React.memo(function MarkerPin({
  id,
  waypoint,
  registerRef,
  onSelect,
  onDeselect,
}: MarkerPinProps) {
  const handleSelected = useCallback(() => onSelect(id), [onSelect, id]);
  const handleDeselected = useCallback(() => onDeselect(id), [onDeselect, id]);

  return (
    <PointAnnotation
      ref={registerRef(id)}
      id={id}
      coordinate={[waypoint.coordinates.longitude, waypoint.coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      onSelected={handleSelected}
      onDeselected={handleDeselected}
    >
      <View style={styles.markerColumn}>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {waypoint.label}
          </Text>
        </View>
        <View style={styles.pinWrap}>
          <Ionicons name="location-sharp" size={PIN_SIZE} color={DESTINATION_COLOR} />
          <View style={styles.pinBadge} />
        </View>
      </View>
    </PointAnnotation>
  );
});

// A pin at every stop of the active/pending route, not just the final destination — the
// route line alone doesn't show where it actually ends, and whatever marker originally
// represented that point (a search result, a quick-add preview) can disappear once its own
// UI closes, leaving the route pointing at nothing visible on the map. Tapping a stop opens
// a callout to save either the whole route or just that point as a place.
export function RouteDestinationMarker({
  waypoints,
  refreshSignal,
  onAnnotationSelected,
  dismissSignal,
  onSaveRoute,
  onSavePoint,
}: Props) {
  const { registerRef } = usePointAnnotationRefresh(refreshSignal);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = selectedId ? Number(selectedId.replace('route-waypoint-', '')) : -1;
  const selected = selectedIndex >= 0 ? waypoints[selectedIndex] : undefined;

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

  const handleSaveRoutePress = useCallback(() => {
    setSelectedId(null);
    onSaveRoute();
  }, [onSaveRoute]);

  const handleSavePointPress = useCallback(() => {
    if (!selected) return;
    setSelectedId(null);
    onSavePoint(selected);
  }, [onSavePoint, selected]);

  return (
    <>
      {waypoints.map((waypoint, index) => (
        <MarkerPin
          key={`route-waypoint-${index}`}
          id={`route-waypoint-${index}`}
          waypoint={waypoint}
          registerRef={registerRef}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      ))}

      {selected && (
        <MarkerView
          coordinate={[selected.coordinates.longitude, selected.coordinates.latitude]}
          anchor={{ x: 0.5, y: 1.3 }}
        >
          <View style={styles.callout}>
            <CircleCloseButton onPress={handleCloseCallout} style={styles.calloutCloseButton} />
            <Text style={styles.calloutName} numberOfLines={1}>
              {selected.label}
            </Text>
            <View style={styles.calloutActionsRow}>
              <TouchableOpacity
                style={[styles.calloutActionButtonBase, styles.calloutSaveRouteButton]}
                hitSlop={HIT_SLOP_8}
                onPress={handleSaveRoutePress}
              >
                <Ionicons name="bookmark-outline" size={22} color={Colors.brand.primary} />
                <Text style={styles.calloutActionLabel}>Save route</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calloutActionButtonBase, styles.calloutSavePointButton]}
                hitSlop={HIT_SLOP_8}
                onPress={handleSavePointPress}
              >
                <Ionicons name="location-outline" size={22} color={Colors.accent.primary} />
                <Text style={styles.calloutActionLabel}>Save point</Text>
              </TouchableOpacity>
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
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  pinWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    position: 'absolute',
    top: 9,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    paddingTop: Spacing.s24,
    minWidth: 220,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutCloseButton: {
    position: 'absolute',
    top: Spacing.s8,
    right: Spacing.s8,
    zIndex: 1,
  },
  calloutName: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
  },
  calloutActionsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  calloutActionButtonBase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s4,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.sm,
    borderWidth: 1.5,
  },
  calloutSaveRouteButton: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.primary,
  },
  calloutSavePointButton: {
    backgroundColor: Colors.accent.light,
    borderColor: Colors.accent.primary,
  },
  calloutActionLabel: {
    ...Typography.caption,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
});
