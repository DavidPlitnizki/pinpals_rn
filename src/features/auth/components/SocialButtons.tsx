import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

interface SocialButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  disabled?: boolean;
}

export function SocialButtons({ onGooglePress, onApplePress, disabled }: SocialButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onGooglePress}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <AntDesign name="google" size={20} color={Colors.brand.primary} />
        <Text style={styles.label}>Continue with Google</Text>
      </TouchableOpacity>
      {/* Apple Sign-In is iOS-only — expo-apple-authentication has no Android backing. */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={styles.button}
          onPress={onApplePress}
          activeOpacity={0.75}
          disabled={disabled}
        >
          <AntDesign name="apple" size={20} color={Colors.brand.primary} />
          <Text style={styles.label}>Continue with Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    ...Typography.headline,
    color: Colors.brand.primary,
    fontSize: 17,
  },
});
