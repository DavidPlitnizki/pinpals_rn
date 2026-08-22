import { Ionicons } from '@expo/vector-icons';
import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { shareSpot } from '../../../shared/sharePlace';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { RouteWaypoint } from '../types';
import { CalloutActionButton } from './CalloutActionButton';

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
          <View style={styles.pinBadge}>
            <Ionicons name="flag" size={12} color={DESTINATION_COLOR} />
          </View>
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

  // Shares the stop as a Google Maps link — opening it drops the recipient straight on the
  // point, which a bare "lat, lng" line doesn't do.
  const handleSharePress = useCallback(() => {
    if (!selected) return;
    shareSpot({ name: selected.label, coordinates: selected.coordinates });
  }, [selected]);

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
            <View style={styles.calloutHeaderRow}>
              <CircleCloseButton onPress={handleCloseCallout} style={styles.calloutCloseButton} />
            </View>
            <View style={styles.calloutIconWrap}>
              <Ionicons name="flag" size={28} color={DESTINATION_COLOR} />
            </View>
            <Text style={styles.calloutName} numberOfLines={1}>
              {selected.label}
            </Text>
            <View style={styles.calloutActionsRow}>
              <CalloutActionButton
                icon="location-outline"
                iconSize={24}
                iconColor={Colors.accent.primary}
                backgroundColor={Colors.accent.light}
                borderColor={Colors.accent.primary}
                onPress={handleSavePointPress}
              />
              <CalloutActionButton
                icon="share-outline"
                iconSize={24}
                iconColor={Colors.neutral[600]}
                backgroundColor={Colors.neutral[100]}
                borderColor={Colors.neutral[400]}
                onPress={handleSharePress}
              />
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
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s16,
    minWidth: 220,
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
  // that box (negative offsets) gets cut off rather than floating over the map.
  calloutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.s8,
  },
  // A dark border keeps the button visible against whatever's under it on the map,
  // instead of blending into busy map tiles.
  calloutCloseButton: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[900],
  },
  calloutIconWrap: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.s4,
  },
  calloutName: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginTop: Spacing.s8,
    marginBottom: Spacing.s12,
  },
  calloutActionsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
});
