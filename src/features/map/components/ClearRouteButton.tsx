import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  // Short press: drop just the last stop. Long press: clear the whole route.
  onPress: () => void;
  onLongPress: () => void;
}

const BUTTON_SIZE = 44;
// Sits directly below ClearMapButton, same top-right column.
const COLUMN_OFFSET = Spacing.s16 + BUTTON_SIZE + Spacing.s8;

export function ClearRouteButton({ onPress, onLongPress }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
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
    paddingTop: COLUMN_OFFSET,
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
