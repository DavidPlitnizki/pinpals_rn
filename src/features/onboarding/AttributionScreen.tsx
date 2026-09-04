import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { AttributionSource } from '../../services/analytics';
import { useAttributionScreen } from './hooks/useAttributionScreen';

interface SourceOption {
  source: AttributionSource;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

// 'skipped' isn't listed here — it's what the X in the corner reports, not a row someone taps.
const SOURCES: SourceOption[] = [
  { source: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { source: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { source: 'twitter', label: 'X (Twitter)', icon: 'logo-twitter' },
  { source: 'telegram', label: 'Telegram', icon: 'paper-plane-outline' },
  { source: 'friends', label: 'Friends', icon: 'people-outline' },
  { source: 'other', label: 'Something else', icon: 'ellipsis-horizontal' },
];

interface RowProps {
  option: SourceOption;
  onSelect: (source: AttributionSource) => void;
}

const SourceRow = React.memo(function SourceRow({ option, onSelect }: RowProps) {
  const handlePress = useCallback(() => onSelect(option.source), [onSelect, option.source]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={option.label}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={option.icon} size={18} color={Colors.brand.primary} />
      </View>
      <Text style={styles.rowLabel}>{option.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
    </TouchableOpacity>
  );
});

// Shown once, right after the tour ends — whether it was finished or skipped (see AuthGate,
// gated on attributionCompleted rather than a stage of its own). One tap picks a source and
// moves straight on: picking one answer out of six is already the whole interaction, so a
// separate "Continue" button would just be one more tap between here and the map. The X
// answers just as completely — "didn't say" is itself worth knowing.
export default function AttributionScreen() {
  const { handleSelect, handleSkip } = useAttributionScreen();

  return (
    <SafeAreaView style={styles.container} edges={SAFE_EDGES}>
      <View style={styles.skipRow}>
        <CircleCloseButton onPress={handleSkip} size={44} accessibilityLabel="Skip this question" />
      </View>

      <Text style={styles.title}>Where did you hear about us?</Text>
      <Text style={styles.subtitle}>Helps us know what&apos;s actually working.</Text>

      <View style={styles.list}>
        {SOURCES.map((option, index) => (
          <React.Fragment key={option.source}>
            {index > 0 && <View style={styles.divider} />}
            <SourceRow option={option} onSelect={handleSelect} />
          </React.Fragment>
        ))}
      </View>
    </SafeAreaView>
  );
}

const SAFE_EDGES = ['top', 'bottom'] as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.s24,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.s8,
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginTop: Spacing.s16,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.s8,
    marginBottom: Spacing.s24,
  },
  list: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s16,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
});
