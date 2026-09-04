import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { Colors } from '../../../design-system/tokens';

const BOUNCE_MS = 520;
const BOUNCE_DISTANCE = 6;
const DEFAULT_SIZE = 34;

interface Props {
  size?: number;
  color?: string;
  // Which way the arrow points, and therefore which way it nudges. 'up' is for a target above
  // the arrow — the tick in the place form's header, which has nothing above it to hang from.
  direction?: 'down' | 'up';
}

// A downward arrow that nudges, pointing at whatever sits below it. The tour's cut-out rings
// a whole card or panel — copilot places its tooltip against whatever it measures, and
// measuring a single button puts the tooltip on top of the thing it is describing — so this
// is what actually singles out one control.
//
// RN's own Animated rather than reanimated: this drives a native-driver transform in a loop
// and never coordinates with layout, so the simpler of the two is enough.
// Memoised because of where it renders: one of these sits inside the place form, which
// re-renders on every keystroke in the name field. Its props are all primitives, so the memo
// holds.
export const OnboardingArrow = React.memo(function OnboardingArrow({
  size = DEFAULT_SIZE,
  color = Colors.accent.primary,
  direction = 'down',
}: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const step = (toValue: number) =>
      Animated.timing(bounce, {
        toValue,
        duration: BOUNCE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  // Always nudges towards what it points at, so the motion reads as pointing rather than
  // drifting.
  const travel = direction === 'up' ? -BOUNCE_DISTANCE : BOUNCE_DISTANCE;

  const style = useMemo(
    () => [
      styles.arrow,
      {
        transform: [
          { translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
        ],
      },
    ],
    [bounce, travel],
  );

  return (
    <Animated.View style={style} pointerEvents="none">
      <Ionicons name={direction === 'up' ? 'arrow-up' : 'arrow-down'} size={size} color={color} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  arrow: { alignItems: 'center' },
});
