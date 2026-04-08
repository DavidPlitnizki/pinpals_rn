import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { Colors, Radii, Spacing, Typography } from "../tokens";

interface PinChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function PinChip({
  label,
  color,
  selected = false,
  onPress,
}: PinChipProps) {
  const bgColor = selected ? color || Colors.brand.primary : "transparent";
  const borderColor = color || Colors.brand.primary;
  const textColor = selected ? Colors.white : Colors.neutral[900];

  const containerStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderWidth: 1.5,
    borderRadius: Radii.full,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    paddingHorizontal: Spacing.s12,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={containerStyle} activeOpacity={1} disabled>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
