import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

interface Props {
  onPress: () => void;
  // True when ClearSearchResultsButton is also showing in the same bottom-right slot —
  // shifts this pill up so the two don't overlap.
  stacked?: boolean;
}

const FAB_SIZE = 56;
const FAB_GAP = Spacing.s12;
const CLUSTER_HEIGHT = FAB_SIZE * 3 + FAB_GAP * 2;
const PILL_STACK_OFFSET = 52;

export function ClearRouteButton({ onPress, stacked }: Props) {
  return (
    <SafeAreaView style={[styles.wrap, stacked && styles.wrapStacked]} pointerEvents="box-none">
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="close-circle" size={18} color={Colors.white} />
        <Text style={styles.label}>Clear route</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Bottom-right, same slot/style as ClearSearchResultsButton (red pill, mirrors "N results").
  wrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24 + CLUSTER_HEIGHT + Spacing.s12,
    paddingRight: Spacing.s16,
  },
  wrapStacked: {
    paddingBottom: Spacing.s24 + CLUSTER_HEIGHT + Spacing.s12 + PILL_STACK_OFFSET,
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
