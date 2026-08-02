import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.28;
const ANIMATION_DURATION = 280;

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Placeholder standing in for the add-place form, which was removed. Rendered inline over
// the map rather than in a Modal — there is no text input here, so none of the keyboard
// behaviour that the old sheet suffered from applies.
export function ComingSoonSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible, backdropOpacity, translateY]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.s24 },
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>
        <Text style={styles.text}>Will be soon</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    alignItems: 'center',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.s12,
    paddingBottom: Spacing.s8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
  },
  text: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginTop: Spacing.s32,
  },
});
