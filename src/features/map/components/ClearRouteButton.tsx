import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../../design-system/tokens';
import {
  MAP_TOP_BUTTON_OFFSET,
  MAP_TOP_BUTTON_RIGHT,
  MAP_TOP_BUTTON_SIZE,
  MAP_TOP_BUTTON_STACKED_OFFSET,
} from '../constants';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  // Short press: drop just the last stop. Long press: clear the whole route.
  onPress: () => void;
  onLongPress: () => void;
  // ClearMapButton (search-results X) only renders when there are search results — when it's
  // also on screen, this button sits directly below it in the same right-edge column;
  // otherwise it takes ClearMapButton's own top slot, level with the route info card.
  stacked: boolean;
}

const BUTTON_SIZE = MAP_TOP_BUTTON_SIZE;

export function ClearRouteButton({ onPress, onLongPress, stacked }: Props) {
  return (
    <SafeAreaView
      style={[
        styles.wrap,
        { paddingTop: stacked ? MAP_TOP_BUTTON_STACKED_OFFSET : MAP_TOP_BUTTON_OFFSET },
      ]}
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
    paddingRight: MAP_TOP_BUTTON_RIGHT,
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
