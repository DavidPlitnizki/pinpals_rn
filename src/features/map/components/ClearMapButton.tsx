import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  onPress: () => void;
}

// Top-right, same slot the old FriendsButton occupied — clears whatever's currently
// highlighted on the map (an active route and/or search result pins).
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
    paddingTop: Spacing.s16,
    paddingRight: Spacing.s16,
  },
});
