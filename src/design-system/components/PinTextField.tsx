import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../tokens';

interface PinTextFieldProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function PinTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...rest
}: PinTextFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = errorMessage
    ? Colors.error
    : focused
      ? Colors.brand.primary
      : Colors.neutral[200];

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputWrapper, { borderColor }, focused && styles.focusedShadow]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.neutral[400]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.s4,
  },
  label: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s4,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
  },
  focusedShadow: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s12,
    ...Typography.body,
    color: Colors.neutral[900],
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: Spacing.s12,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.s4,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.s4,
  },
  iconLeft: {
    paddingLeft: Spacing.s12,
  },
  iconRight: {
    paddingRight: Spacing.s12,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.s4,
  },
});
