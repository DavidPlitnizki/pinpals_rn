import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { MAP_SEARCH_BAR_HEIGHT } from '../constants';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  onPress: () => void;
}

// Top-right, below MapSearchBar's pill + quick-chip row so it never overlaps them — clears
// whatever's currently highlighted on the map (an active route and/or search result pins).
export function ClearMapButton({ onPress }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <RoundMapButton onPress={onPress} color="#E4483C">
        <Ionicons name="close" size={22} color={Colors.white} />
      </RoundMapButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: MAP_SEARCH_BAR_HEIGHT + Spacing.s12,
    paddingRight: Spacing.s16,
  },
});
