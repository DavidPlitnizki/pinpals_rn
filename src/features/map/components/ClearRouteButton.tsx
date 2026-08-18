import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { MAP_SEARCH_BAR_HEIGHT } from '../constants';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  // Short press: drop just the last stop. Long press: clear the whole route.
  onPress: () => void;
  onLongPress: () => void;
  // ClearMapButton (search-results X) only renders when there are search results — when it's
  // also on screen, this button stacks directly below it in the same top-right column;
  // otherwise this is the top-most button in that column, so it takes ClearMapButton's slot.
  stacked: boolean;
}

const BUTTON_SIZE = 44;
const TOP_OFFSET = MAP_SEARCH_BAR_HEIGHT + Spacing.s12;
const STACKED_OFFSET = TOP_OFFSET + BUTTON_SIZE + Spacing.s8;

export function ClearRouteButton({ onPress, onLongPress, stacked }: Props) {
  return (
    <SafeAreaView
      style={[styles.wrap, { paddingTop: stacked ? STACKED_OFFSET : TOP_OFFSET }]}
      pointerEvents="box-none"
    >
      <RoundMapButton
        onPress={onPress}
        onLongPress={onLongPress}
        color="#E4483C"
        size={BUTTON_SIZE}
      >
        <MaterialCommunityIcons name="road-variant" size={22} color={Colors.white} />
        <View style={styles.slash} />
      </RoundMapButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingRight: Spacing.s16,
  },
  // A "no entry" style diagonal bar over the road icon — inset from the circle's edges.
  slash: {
    position: 'absolute',
    width: BUTTON_SIZE * 0.6,
    height: 1.5,
    backgroundColor: Colors.white,
    transform: [{ rotate: '-45deg' }],
  },
});
