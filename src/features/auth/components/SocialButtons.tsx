import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  Colors,
  Radii,
  Spacing,
  Typography,
} from "../../../design-system/tokens";

interface SocialButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
}

export function SocialButtons({
  onGooglePress,
  onApplePress,
}: SocialButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onGooglePress}
        activeOpacity={0.75}
      >
        <AntDesign name="google" size={20} color={Colors.brand.primary} />
        <Text style={styles.label}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={onApplePress}
        activeOpacity={0.75}
      >
        <AntDesign name="apple" size={20} color={Colors.brand.primary} />
        <Text style={styles.label}>Continue with Apple</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s8,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s16,
    backgroundColor: Colors.white,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    ...Typography.headline,
    color: Colors.brand.primary,
    fontSize: 17,
  },
});
