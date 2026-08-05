import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { Colors } from '../tokens';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const DEFAULT_SIZE = 28;

interface Props {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

// Shared "X in a circle" dismiss control used across every popup/modal/callout in the map
// feature, so closing any of them looks and behaves the same way.
export function CircleCloseButton({ onPress, style, size = DEFAULT_SIZE }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      activeOpacity={0.7}
    >
      <Ionicons name="close" size={Math.round(size * 0.6)} color={Colors.neutral[600]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
