import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Radii, Spacing, Typography } from '../../../design-system/tokens';
import { HIT_SLOP_8 } from '../constants';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  // Omit for an icon-only button (MapMarkers' Directions/Delete style) — pass it when the
  // icon alone wouldn't be obvious.
  label?: string;
  iconSize?: number;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
  // Greys nothing out on its own — the caller already colours a disabled button — it only
  // stops the press and drops the button out of the accessibility order.
  disabled?: boolean;
  // Required because most of these buttons are icon-only: without it a screen reader reads
  // nothing at all where a globe, an arrow or a plus is.
  accessibilityLabel: string;
  onPress: () => void;
}

// A single icon(+label) action button for map callouts (MapMarkers, NativePoiMarker,
// SearchResultMarker, RouteDestinationMarker, ...) — every callout's action row renders this
// instead of its own bespoke button, so every popup's "row of actions" looks and behaves the
// same way. Color, icon, and label all come from props; layout/typography stay fixed.
export function CalloutActionButton({
  icon,
  label,
  iconSize = 20,
  iconColor,
  backgroundColor,
  borderColor,
  disabled = false,
  accessibilityLabel,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={HIT_SLOP_8}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      {label && (
        <Text style={[styles.label, { color: iconColor }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s4,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.sm,
    borderWidth: 1.5,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
