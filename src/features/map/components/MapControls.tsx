import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Radii, Spacing } from "../../../design-system/tokens";
import { Coordinates } from "../../../models/types";

interface Props {
  gpsCoords: Coordinates | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterGPS: () => void;
  onAdd: () => void;
  onSearch: () => void;
}

export function MapControls({
  gpsCoords,
  onZoomIn,
  onZoomOut,
  onCenterGPS,
  onAdd,
  onSearch,
}: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <View style={styles.cluster}>
        <TouchableOpacity style={styles.fab} onPress={onSearch}>
          <Ionicons name="search" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={onZoomIn}>
            <Text style={styles.controlIcon}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={onZoomOut}>
            <Text style={styles.controlIcon}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, !gpsCoords && styles.controlBtnDisabled]}
            onPress={onCenterGPS}
            disabled={!gpsCoords}
          >
            <Text
              style={[
                styles.controlIcon,
                !gpsCoords && styles.controlIconDisabled,
              ]}
            >
              ◎
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.fab} onPress={onAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const controlBtnBase = {
  width: 44,
  height: 44,
  borderRadius: Radii.md,
  backgroundColor: Colors.white,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 4,
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingBottom: Spacing.s24,
    paddingRight: Spacing.s16,
  },
  cluster: { alignItems: "center", gap: Spacing.s12 },
  controls: { gap: Spacing.s8, alignItems: "center" },
  controlBtn: controlBtnBase,
  controlBtnDisabled: { opacity: 0.35 },
  controlIcon: { fontSize: 22, color: Colors.neutral[800], lineHeight: 26 },
  controlIconDisabled: { color: Colors.neutral[400] },
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
  fabText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    fontWeight: "400",
  },
});
