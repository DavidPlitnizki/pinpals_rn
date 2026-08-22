import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../../../design-system/tokens';

interface Props {
  // Bumped once per fly-to; each new value replays the landing.
  signal: number;
  onDone: () => void;
}

const CAMERA_FLIGHT_MS = 1200;

// A plane that glides in over the map centre — where the camera is flying to — touches down,
// then lifts away. Purely a "you have arrived here" cue: it sits in an untouchable overlay so
// it never intercepts a tap meant for the map.
export function FlyToLandingMarker({ signal, onDone }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSequence(
      // Descend and settle while the camera itself is still flying.
      withTiming(1, { duration: CAMERA_FLIGHT_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(
        450,
        withTiming(2, { duration: 400, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }, [signal, progress, onDone]);

  const planeStyle = useAnimatedStyle(() => {
    const landing = Math.min(progress.value, 1);
    const leaving = Math.max(progress.value - 1, 0);
    return {
      opacity: progress.value <= 1 ? landing : 1 - leaving,
      transform: [
        { translateX: (1 - landing) * -120 + leaving * 120 },
        { translateY: (1 - landing) * -90 - leaving * 60 },
        { scale: 0.8 + landing * 0.4 - leaving * 0.2 },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const landing = Math.min(progress.value, 1);
    const leaving = Math.max(progress.value - 1, 0);
    return {
      opacity: landing * 0.35 * (1 - leaving),
      transform: [{ scale: 0.4 + landing * 0.6 }],
    };
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.shadow, shadowStyle]} />
      <Animated.View style={planeStyle}>
        <Ionicons name="airplane" size={40} color={Colors.brand.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    width: 44,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.neutral[900],
    marginTop: 34,
  },
});
