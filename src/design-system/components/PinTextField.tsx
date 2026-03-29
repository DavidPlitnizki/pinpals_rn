import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../tokens';

interface PinTextFieldProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function PinTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  ...rest
}: PinTextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[400]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
      />
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
  input: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s12,
    ...Typography.body,
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: Spacing.s12,
  },
});
