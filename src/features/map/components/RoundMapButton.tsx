import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { Colors } from '../../../design-system/tokens';

interface Props {
  onPress: () => void;
  onLongPress?: () => void;
  color: string;
  size?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

const DEFAULT_SIZE = 44;

// Shared round FAB-style button for every map overlay control (route/search FABs, the
// top-right "clear" buttons) — color, size, icon, and callbacks all come from props so
// there's one place owning the press animation, shadow, and border.
export function RoundMapButton({
  onPress,
  onLongPress,
  color,
  size = DEFAULT_SIZE,
  disabled,
  children,
}: Props) {
  const scale = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, [scale]);

  return (
    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            styles.btn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
            disabled && styles.disabled,
            animatedScaleStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  disabled: { opacity: 0.35 },
});
