import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Colors, Radii, Spacing, Typography } from "../tokens";

interface PinChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
}

export function PinChip({
  label,
  color,
  selected = false,
  onPress,
  leftIcon,
}: PinChipProps) {
  const bgColor = selected ? color || Colors.brand.primary : "transparent";
  const borderColor = color || Colors.brand.primary;
  const textColor = selected ? Colors.white : Colors.neutral[900];

  const containerStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderWidth: 1.5,
    borderRadius: Radii.full,
    flexDirection: "row",
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

  const content = (
    <>
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  // Static chip — uses View, not a disabled TouchableOpacity
  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  label: {
    ...Typography.caption,
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: Spacing.s4,
  },
});
