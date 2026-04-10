import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface PinButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function PinButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
}: PinButtonProps) {
  const isDisabled = disabled || loading;

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger') return Colors.white;
    return variant === 'secondary' ? Colors.brand.primary : Colors.brand.primary;
  };

  const getActivityColor = () => {
    if (variant === 'primary' || variant === 'danger') return Colors.white;
    return Colors.brand.primary;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles[`pressed_${variant}`],
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={getActivityColor()} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              styles[`textVariant_${variant}`],
              styles[`textSize_${size}`],
              { color: getTextColor() },
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
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
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.s8,
  },
  iconRight: {
    marginLeft: Spacing.s8,
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
  variant_danger: {
    backgroundColor: Colors.error,
  },

  // Pressed states
  pressed_primary: {
    backgroundColor: Colors.brand.dark,
  },
  pressed_secondary: {
    backgroundColor: Colors.brand.light,
  },
  pressed_ghost: {
    backgroundColor: Colors.neutral[50],
  },
  pressed_danger: {
    backgroundColor: '#C62828',
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

  // Text variants (color handled inline)
  textVariant_primary: {},
  textVariant_secondary: {},
  textVariant_ghost: {},
  textVariant_danger: {},

  // Text sizes
  textSize_sm: {
    ...Typography.footnote,
    fontFamily: Typography.headline.fontFamily,
  },
  textSize_md: {
    ...Typography.callout,
    fontFamily: Typography.headline.fontFamily,
  },
  textSize_lg: {
    ...Typography.headline,
  },
});
