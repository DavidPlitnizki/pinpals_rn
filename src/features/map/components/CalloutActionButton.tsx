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
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor }]}
      onPress={onPress}
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
