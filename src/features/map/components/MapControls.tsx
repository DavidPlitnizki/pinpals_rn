import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing } from "../../../design-system/tokens";
import { Coordinates } from "../../../models/types";

interface Props {
  gpsCoords: Coordinates | null;
  onCenterGPS: () => void;
  onAdd: () => void;
  onSearch: () => void;
}

export function MapControls({ gpsCoords, onCenterGPS, onAdd, onSearch }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <View style={styles.cluster}>
        <TouchableOpacity style={styles.fab} onPress={onSearch}>
          <Ionicons name="search" size={26} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, !gpsCoords && styles.fabDisabled]}
          onPress={onCenterGPS}
          disabled={!gpsCoords}
        >
          <Ionicons name="locate" size={26} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={onAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24,
    paddingRight: Spacing.s16,
  },
  cluster: { alignItems: "center", gap: Spacing.s12 },
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
  fabDisabled: { opacity: 0.35 },
  fabText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    fontWeight: "400",
  },
});
