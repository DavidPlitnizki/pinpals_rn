import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing } from '../../../design-system/tokens';

interface Props {
  children: ReactNode;
}

// Every map card used to be a Mapbox MarkerView — a child of the native map view, which no
// zIndex can lift above the search bar or the round controls: those are RN siblings painted
// after the map, always. Anchoring the card to the bottom of the screen instead takes it out
// of the map entirely, so it's an ordinary sibling that simply renders last and wins. It also
// removes the older problem the anchored callout had — a tall card on a pin near the top edge
// had nowhere to go and got clipped or overlapped whatever chrome was there.
//
// Rendered last in MapScreen. Keep it that way: its layering is positional, not numeric.
export function MapCardSheet({ children }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <SafeAreaView edges={['bottom']} pointerEvents="box-none">
        <Animated.View
          style={styles.card}
          entering={SlideInDown.duration(220)}
          exiting={SlideOutDown.duration(160)}
        >
          {children}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Kept separate from the sheet so a card can fade its own content when it swaps between
// selections without the sheet itself sliding out and back in.
export const MapCardFade = { entering: FadeIn.duration(150), exiting: FadeOut.duration(100) };

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    marginHorizontal: Spacing.s12,
    marginBottom: Spacing.s12,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
});
