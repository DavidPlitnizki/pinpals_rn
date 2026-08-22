import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../tokens';

// The two place flags have confusingly similar names in the data model — `favorite` is the
// heart, `isFavorite` is "want to visit" (see the v3→v4 store migration). Every surface that
// shows them goes through this file, so the symbol and colour for each can never drift apart
// again: heart/red = loved it, bookmark/orange = still want to go.
export const FLAG_FAVORITE_COLOR = Colors.error;
export const FLAG_WANT_COLOR = Colors.accent.primary;

export type PlaceFlag = 'favorite' | 'wantToVisit';

const FLAG_ICONS: Record<PlaceFlag, { on: 'heart' | 'bookmark'; off: string; color: string }> = {
  favorite: { on: 'heart', off: 'heart-outline', color: FLAG_FAVORITE_COLOR },
  wantToVisit: { on: 'bookmark', off: 'bookmark-outline', color: FLAG_WANT_COLOR },
};

const FLAG_LABELS: Record<PlaceFlag, string> = {
  favorite: 'Favorite',
  wantToVisit: 'Want to visit',
};

interface BadgesProps {
  favorite?: boolean;
  wantToVisit?: boolean;
  size?: number;
}

// Read-only pair for cards and callouts — shows only the flags that are actually set.
export function PlaceFlagBadges({ favorite, wantToVisit, size = 14 }: BadgesProps) {
  if (!favorite && !wantToVisit) return null;
  return (
    <View style={styles.badges}>
      {favorite && (
        <Ionicons
          name="heart"
          size={size}
          color={FLAG_FAVORITE_COLOR}
          accessibilityLabel={FLAG_LABELS.favorite}
        />
      )}
      {wantToVisit && (
        <Ionicons
          name="bookmark"
          size={size}
          color={FLAG_WANT_COLOR}
          accessibilityLabel={FLAG_LABELS.wantToVisit}
        />
      )}
    </View>
  );
}

interface ToggleProps {
  flag: PlaceFlag;
  active: boolean;
  onPress: () => void;
  // Optional tally shown beside the icon, parenthesised to match the "All (12)" tab it sits
  // next to.
  count?: number;
  size?: number;
}

// Interactive pill used by the Remembrance filter row and the place detail header. The fill
// animates in rather than snapping, and both states are drawn at once and cross-faded —
// colour itself can't run on the native driver, but opacity can.
export function PlaceFlagToggle({ flag, active, onPress, count, size = 20 }: ToggleProps) {
  const { on, off, color } = FLAG_ICONS[flag];
  const fill = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(fill, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 90,
    }).start();
  }, [active, fill]);

  const fillStyle = {
    backgroundColor: color,
    opacity: fill,
    transform: [{ scale: fill.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
  };

  return (
    <TouchableOpacity
      style={[styles.toggle, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={FLAG_LABELS[flag]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.toggleFill, fillStyle]} />

      <View style={styles.toggleIconStack}>
        <Ionicons name={off as 'heart-outline'} size={size} color={color} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.toggleIconOn, { opacity: fill }]}>
          <Ionicons name={on} size={size} color={Colors.white} />
        </Animated.View>
      </View>

      {count !== undefined && (
        <Text style={[styles.toggleCount, active && styles.toggleCountActive]}>({count})</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    paddingHorizontal: Spacing.s12,
    height: 36,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleFill: {
    borderRadius: Radii.full,
  },
  toggleIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconOn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCount: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.neutral[700],
  },
  toggleCountActive: {
    color: Colors.white,
  },
});
