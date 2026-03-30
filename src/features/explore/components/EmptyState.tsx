import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, Spacing, Typography } from "../../../design-system/tokens";

interface Props {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.title}>No places found</Text>
      <Text style={styles.subtitle}>
        {hasFilters
          ? "Try adjusting your search or filters"
          : "Long press on the map to add your first place"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.s32,
  },
  icon: { fontSize: 48, marginBottom: Spacing.s16 },
  title: {
    ...Typography.title3,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.neutral[400],
    textAlign: "center",
  },
});
