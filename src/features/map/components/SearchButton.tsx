import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing } from "../../../design-system/tokens";

interface Props {
  onPress: () => void;
}

export function SearchButton({ onPress }: Props) {
  return (
    <SafeAreaView style={styles.safe} pointerEvents="box-none" edges={["bottom"]}>
      <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="search" size={26} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24,
    paddingRight: Spacing.s16,
    pointerEvents: "box-none",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 26,
    color: Colors.white,
    lineHeight: 30,
  },
});
