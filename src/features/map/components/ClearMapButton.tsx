import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../../design-system/tokens';
import { MAP_ROUTE_TOP_OFFSET, MAP_TOP_BUTTON_OFFSET, MAP_TOP_BUTTON_RIGHT } from '../constants';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  onPress: () => void;
  // True while a route is active: the search bar is gone, so this button rides up with the
  // route info card instead of sitting in empty space below where the search bar used to be.
  raised: boolean;
}

// Top-right, below MapSearchBar's pill + quick-chip row so it never overlaps them — clears
// pinned search results and the category filter, nothing else. ClearRouteButton (the
// crossed-out-road icon) is the dedicated control for the route; this button never touches
// it, and it never touches these markers.
export function ClearMapButton({ onPress, raised }: Props) {
  return (
    <SafeAreaView
      style={[styles.wrap, raised ? styles.raised : styles.lowered]}
      pointerEvents="box-none"
    >
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
    paddingRight: MAP_TOP_BUTTON_RIGHT,
  },
  lowered: { paddingTop: MAP_TOP_BUTTON_OFFSET },
  raised: { paddingTop: MAP_ROUTE_TOP_OFFSET },
});
