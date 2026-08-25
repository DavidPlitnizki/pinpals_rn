import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { useReverseGeocodedAddress } from '../../../hooks/useReverseGeocodedAddress';
import { Coordinates } from '../../../models/types';
import { formatDistance, formatDuration } from '../../../shared/format';
import { HIT_SLOP_16, MAP_ROUTE_TOP_OFFSET, MAP_TOP_BUTTON_GUTTER } from '../constants';
import { RouteProfile, RouteStep } from '../types';

interface Props {
  destinationLabel: string;
  // Used to look up the destination's street address — the label alone is usually just a
  // street or POI name, which doesn't say which part of town the route ends in.
  destinationCoordinates: Coordinates | null;
  profile: RouteProfile;
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
  nearestStepIndex: number | null;
  onShareRoute: () => void;
}

const PROFILE_ICON: Record<RouteProfile, React.ComponentProps<typeof Ionicons>['name']> = {
  walking: 'walk',
  driving: 'car',
  cycling: 'bicycle',
};

const STEPS_LIST_MAX_HEIGHT = 220;

export function RouteInfoCard({
  destinationLabel,
  destinationCoordinates,
  profile,
  distanceMeters,
  durationSeconds,
  steps,
  nearestStepIndex,
  onShareRoute,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setExpanded((e) => !e), []);
  const address = useReverseGeocodedAddress(destinationCoordinates);

  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none" edges={['top']}>
      <View style={styles.card}>
        {/* Share sits top-left in its own header row, the same slot it occupies on every map
            callout — one place to look for it regardless of which card is open. */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onShareRoute} hitSlop={HIT_SLOP_16} style={styles.shareButton}>
            <Ionicons name="share-outline" size={16} color={Colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <Ionicons name={PROFILE_ICON[profile]} size={18} color={Colors.brand.primary} />
          <View style={styles.textCol}>
            <Text style={styles.destination} numberOfLines={1}>
              {destinationLabel}
            </Text>
            <Text style={styles.meta}>
              {formatDistance(distanceMeters)} · {formatDuration(durationSeconds)}
            </Text>
            {address ? (
              <Text style={styles.address} numberOfLines={2}>
                {address}
              </Text>
            ) : null}
          </View>
          {steps.length > 0 && (
            <TouchableOpacity onPress={toggleExpanded} hitSlop={HIT_SLOP_16}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.neutral[500]}
              />
            </TouchableOpacity>
          )}
        </View>

        {expanded && steps.length > 0 && (
          <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
            {steps.map((step, idx) => (
              <View
                key={idx}
                style={[styles.stepRow, idx === nearestStepIndex && styles.stepRowActive]}
              >
                <Text
                  style={[
                    styles.stepInstruction,
                    idx === nearestStepIndex && styles.stepInstructionActive,
                  ]}
                  numberOfLines={2}
                >
                  {step.instruction}
                </Text>
                <Text style={styles.stepDistance}>{formatDistance(step.distanceMeters)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Mapbox requires their Directions results to be credited wherever they're shown
            off-map — the map's own attribution control doesn't cover this card. */}
        <Text style={styles.attribution}>Directions powered by Mapbox © OpenStreetMap</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Level with the round clear buttons rather than below them, and inset from the right by
    // enough to keep a long destination label out from under them.
    paddingTop: MAP_ROUTE_TOP_OFFSET,
    paddingLeft: Spacing.s16,
    paddingRight: MAP_TOP_BUTTON_GUTTER,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  textCol: { flexShrink: 1 },
  // Pulled out past the card's own padding so the button sits near its corner rather than
  // floating inset with the text below it.
  headerRow: {
    flexDirection: 'row',
    marginTop: -Spacing.s4,
    marginLeft: -Spacing.s8,
    marginBottom: Spacing.s2,
  },
  shareButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  destination: {
    ...Typography.subheadline,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  meta: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginTop: Spacing.s2,
  },
  address: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
  },
  attribution: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: Colors.neutral[400],
    marginTop: Spacing.s8,
  },
  stepsList: {
    maxHeight: STEPS_LIST_MAX_HEIGHT,
    marginTop: Spacing.s12,
  },
  stepRow: {
    paddingVertical: Spacing.s8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  stepRowActive: {
    backgroundColor: Colors.brand.light,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.s8,
  },
  stepInstruction: {
    ...Typography.footnote,
    color: Colors.neutral[900],
  },
  stepInstructionActive: {
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  stepDistance: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
  },
});
