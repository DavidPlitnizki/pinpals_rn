import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing } from '../../../design-system/tokens';
import { CONTROLS_BOTTOM_GAP } from './MapControls';

// How long the card takes to slide in. Exported because anything that measures the card's
// contents has to wait this out first — copilot's onboarding highlight measured it mid-flight
// and drew its cut-out across a card that was still moving.
export const MAP_CARD_ENTER_MS = 220;

// Backstop for `onEntered`. The animation's own callback is the real signal, but a card that
// is interrupted or never animates would otherwise never report — and whatever is waiting on
// it (the onboarding highlight) would wait forever.
const ENTER_CALLBACK_FALLBACK_MS = MAP_CARD_ENTER_MS + 250;

// How tall a card may grow before its own scrollable part takes over. The card clips whatever
// overflows it (overflow: 'hidden', which is what gives it its rounded corners), so it needs a
// limit it can actually respect — and the card is responsible for keeping its action row
// outside whatever scrolls, so the buttons stay visible at any height.
const MAX_CARD_HEIGHT_RATIO = 0.8;

interface Props {
  children: ReactNode;
  // Fired once the card has finished sliding in and is at rest. Anything that measures the
  // card's contents has to wait for this: copilot's onboarding highlight measured mid-flight
  // and drew its cut-out across a card that was still moving.
  onEntered?: () => void;
}

// Every map card used to be a Mapbox MarkerView — a child of the native map view, which no
// zIndex can lift above the search bar or the round controls: those are RN siblings painted
// after the map, always. Anchoring the card to the bottom of the screen instead takes it out
// of the map entirely, so it's an ordinary sibling that simply renders last and wins. It also
// removes the older problem the anchored callout had — a tall card on a pin near the top edge
// had nowhere to go and got clipped or overlapped whatever chrome was there.
//
// Rendered last in MapScreen. Keep it that way: its layering is positional, not numeric.
export function MapCardSheet({ children, onEntered }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // A cap, not a height: the card is only as tall as it needs to be, and a short card leaves
  // no empty panel below its content. Past the cap the scroll area inside takes over. Measured
  // against the space between the safe areas, so the cap never reaches under the notch or the
  // home indicator.
  const clipStyle = useMemo(
    () => [
      styles.clip,
      { maxHeight: (windowHeight - insets.top - insets.bottom) * MAX_CARD_HEIGHT_RATIO },
    ],
    [windowHeight, insets.top, insets.bottom],
  );

  // The card's bottom edge lines up with the bottom of the round control cluster on the right,
  // so the two read as sitting on one shelf: the same safe-area inset MapControls' SafeAreaView
  // applies, plus the gap it owns.
  const wrapStyle = useMemo(
    () => [styles.wrap, { paddingBottom: insets.bottom + CONTROLS_BOTTOM_GAP }],
    [insets.bottom],
  );

  // Reported at most once per mounted card, from whichever comes first — the animation's own
  // completion or the fallback timer.
  const reportedRef = useRef(false);
  const onEnteredRef = useRef(onEntered);
  useEffect(() => {
    onEnteredRef.current = onEntered;
  }, [onEntered]);

  const reportEntered = useMemo(
    () => () => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      onEnteredRef.current?.();
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(reportEntered, ENTER_CALLBACK_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [reportEntered]);

  // Tied to the animation itself rather than to a duration guessed alongside it: reanimated
  // starts an entering animation a frame or two after mount, so a plain timer of the same
  // length lands while the card is still moving.
  const entering = useMemo(
    () =>
      SlideInDown.duration(MAP_CARD_ENTER_MS).withCallback((finished: boolean) => {
        'worklet';
        if (finished) runOnJS(reportEntered)();
      }),
    [reportEntered],
  );

  return (
    <View style={wrapStyle} pointerEvents="box-none">
      <Animated.View
        style={styles.card}
        entering={entering}
        exiting={SlideOutDown.duration(160)}
        // Load-bearing. A card's contents grow after it is on screen: the address, phone and
        // website are looked up asynchronously and arrive a moment later. Without a layout
        // transition the view keeps the frame it was given when it animated in, and the extra
        // rows are silently cut off by overflow:'hidden' — taking the action buttons with
        // them. This re-measures the card whenever its contents change size.
        layout={LinearTransition.duration(160)}
      >
        {/* The rounding and the clipping live one level below the shadow, not with it. iOS
            draws a view's shadow on the same layer that `overflow: 'hidden'` sets
            clipsToBounds on, so a single view cannot both clip its contents and cast a
            shadow — the shadow gets clipped away with everything else. */}
        <View style={clipStyle}>{children}</View>
      </Animated.View>
    </View>
  );
}

// Kept separate from the sheet so a card can fade its own content when it swaps between
// selections without the sheet itself sliding out and back in.
export const MapCardFade = { entering: FadeIn.duration(150), exiting: FadeOut.duration(100) };

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Sits on the bottom edge, level with the round controls beside it, and grows upward from
    // there — a tall card has the whole screen above it to use, and the map stays uncovered
    // wherever the card does not reach.
    justifyContent: 'flex-end',
  },
  card: {
    marginHorizontal: Spacing.s12,
    // Matches the clip below so the shadow iOS derives from this view's outline follows the
    // rounded corners rather than squaring them off.
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  clip: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
});
