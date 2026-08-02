import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { formatDistance, formatDuration } from '../../../shared/format';
import { HIT_SLOP_16 } from '../constants';
import { RouteProfile, RouteStep } from '../types';

interface Props {
  destinationLabel: string;
  profile: RouteProfile;
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
  nearestStepIndex: number | null;
}

const PROFILE_ICON: Record<RouteProfile, React.ComponentProps<typeof Ionicons>['name']> = {
  walking: 'walk',
  driving: 'car',
  cycling: 'bicycle',
};

// FriendsButton floats top-right (44pt button, Spacing.s16 top inset). A long
// destination label can grow this card up to its maxWidth and reach that corner,
// so push the card below the button's row instead of relying on horizontal luck.
const FRIENDS_BUTTON_CLEARANCE = Spacing.s16 + 44 + Spacing.s12;
const STEPS_LIST_MAX_HEIGHT = 220;

export function RouteInfoCard({
  destinationLabel,
  profile,
  distanceMeters,
  durationSeconds,
  steps,
  nearestStepIndex,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setExpanded((e) => !e), []);

  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none" edges={['top']}>
      <View style={styles.card}>
        <View style={styles.summaryRow}>
          <Ionicons name={PROFILE_ICON[profile]} size={18} color={Colors.brand.primary} />
          <View style={styles.textCol}>
            <Text style={styles.destination} numberOfLines={1}>
              {destinationLabel}
            </Text>
            <Text style={styles.meta}>
              {formatDistance(distanceMeters)} · {formatDuration(durationSeconds)}
            </Text>
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
    paddingTop: FRIENDS_BUTTON_CLEARANCE,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  textCol: { flexShrink: 1 },
  destination: {
    ...Typography.subheadline,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  meta: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginTop: 2,
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
    marginTop: 2,
  },
});
