import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

interface Props {
  toastAnim: Animated.Value;
  toastMsg: string;
  toastGPS: boolean;
}

export function MapToast({ toastAnim, toastMsg, toastGPS }: Props) {
  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0],
  });

  return (
    <Animated.View
      style={[
        styles.toast,
        toastGPS ? styles.toastGPS : styles.toastDefault,
        { opacity: toastAnim, transform: [{ translateY: toastTranslateY }] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.toastText}>{toastMsg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastGPS: { backgroundColor: Colors.brand.primary },
  toastDefault: { backgroundColor: Colors.neutral[700] },
  toastText: { ...Typography.footnote, color: Colors.white, fontWeight: '600' },
});
