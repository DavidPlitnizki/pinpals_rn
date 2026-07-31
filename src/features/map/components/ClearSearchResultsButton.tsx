import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

interface Props {
  count: number;
  onPress: () => void;
}

const FAB_SIZE = 56;
const FAB_GAP = Spacing.s12;
const CLUSTER_HEIGHT = FAB_SIZE * 3 + FAB_GAP * 2;

export function ClearSearchResultsButton({ count, onPress }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="close-circle" size={18} color={Colors.white} />
        <Text style={styles.label}>
          {count} result{count === 1 ? '' : 's'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24 + CLUSTER_HEIGHT + Spacing.s12,
    paddingRight: Spacing.s16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.md,
    backgroundColor: '#E4483C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
});
