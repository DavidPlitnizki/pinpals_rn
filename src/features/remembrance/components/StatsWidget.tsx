import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { CATEGORY_COLORS } from '../../../shared/constants';
import { PlaceStats } from '../hooks/useRemembranceScreen';

interface Props {
  stats: PlaceStats;
}

export function StatsWidget({ stats }: Props) {
  if (stats.total === 0) return null;

  const catColor = stats.favCategory
    ? CATEGORY_COLORS[stats.favCategory.category]
    : Colors.brand.primary;

  return (
    <View style={styles.container}>
      <StatCell value={String(stats.total)} label="мест" accent={Colors.brand.primary} />
      <View style={styles.divider} />
      <StatCell value={stats.favCategory?.label ?? '—'} label="любимая" accent={catColor} />
      <View style={styles.divider} />
      <StatCell value={stats.activeMonth ?? '—'} label="активный" accent={Colors.accent.primary} />
    </View>
  );
}

function StatCell({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
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
  },
  value: {
    ...Typography.title2,
    fontWeight: '700',
  },
  label: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.s4,
  },
});
