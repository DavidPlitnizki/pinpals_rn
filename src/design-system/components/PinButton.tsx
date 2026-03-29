import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface PinButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

export function PinButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  loading = false,
}: PinButtonProps) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyle = [
    styles.text,
    styles[`textVariant_${variant}`],
    styles[`textSize_${size}`],
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.brand.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.brand.primary,
  },
  variant_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
  },
  size_md: {
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s12,
  },
  size_lg: {
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s16,
  },

  // Text base
  text: {
    ...Typography.headline,
  },

  // Text variants
  textVariant_primary: {
    color: Colors.white,
  },
  textVariant_secondary: {
    color: Colors.brand.primary,
  },
  textVariant_ghost: {
    color: Colors.brand.primary,
  },

  // Text sizes
  textSize_sm: {
    fontSize: 14,
  },
  textSize_md: {
    fontSize: 16,
  },
  textSize_lg: {
    fontSize: 17,
  },
});
