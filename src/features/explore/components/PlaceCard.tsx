import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PinCard } from "../../../design-system/components/PinCard";
import { PinChip } from "../../../design-system/components/PinChip";
import { PinRatingView } from "../../../design-system/components/PinRatingView";
import { Colors, Spacing, Typography } from "../../../design-system/tokens";
import { Place } from "../../../models/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";

interface Props {
  place: Place;
  onPress: (id: string) => void;
}

export function PlaceCard({ place, onPress }: Props) {
  return (
    <TouchableOpacity onPress={() => onPress(place.id)} activeOpacity={0.75}>
      <PinCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>
            {place.isFavorite && <Text style={styles.heart}>♥</Text>}
          </View>
          <PinChip
            label={CATEGORY_LABELS[place.category]}
            color={CATEGORY_COLORS[place.category]}
            selected
          />
        </View>
        {place.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {place.description}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <PinRatingView rating={place.rating} size={14} />
          <Text style={styles.date}>
            {new Date(place.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </PinCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.s8,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s4,
    marginRight: Spacing.s8,
  },
  name: { ...Typography.headline, color: Colors.neutral[900], flex: 1 },
  heart: { fontSize: 16, color: Colors.accent.primary },
  description: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    marginBottom: Spacing.s8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { ...Typography.caption, color: Colors.neutral[400] },
});
