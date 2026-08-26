import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { PlaceStats } from '../hooks/useRemembranceScreen';

interface Props {
  stats: PlaceStats;
}

// Read-only on purpose: the middle cell used to be "most visited" and opened that place —
// both a second, invisible way in and a duplicate of the widget right below, which shows the
// same place by name and photo.
export function StatsWidget({ stats }: Props) {
  if (stats.total === 0) return null;

  return (
    <View style={styles.container}>
      <StatCell value={String(stats.total)} label="total places" accent={Colors.brand.primary} />
      <View style={styles.divider} />
      <StatCell
        value={String(stats.memories)}
        label={stats.memories === 1 ? 'memory' : 'memories'}
        accent={Colors.brand.dark}
      />
      <View style={styles.divider} />
      <StatCell
        value={stats.topMonth?.label ?? '—'}
        label={stats.topMonth ? `${stats.topMonth.count} added` : 'added'}
        accent={Colors.accent.primary}
      />
    </View>
  );
}

function StatCell({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    // A place name can be far longer than its share of the row, so it truncates with an
    // ellipsis instead of shrinking to an unreadable size — adjustsFontSizeToFit only helps
    // when the overflow is slight.
    <View style={styles.cell}>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.s4,
  },
  value: {
    ...Typography.title2,
    fontWeight: '700',
  },
  label: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.s4,
  },
});
