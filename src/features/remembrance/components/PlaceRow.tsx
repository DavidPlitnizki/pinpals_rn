import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { PinCard } from "../../../design-system/components/PinCard";
import { PinChip } from "../../../design-system/components/PinChip";
import { PinRatingView } from "../../../design-system/components/PinRatingView";
import { Colors, Radii, Spacing, Typography } from "../../../design-system/tokens";
import { Place } from "../../../models/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../../shared/constants";

interface Props {
  place: Place;
  onPress: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function PlaceRow({ place, onPress, onDelete }: Props) {
  return (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onDelete(place.id, place.name)}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      )}
      overshootRight={false}
    >
      <TouchableOpacity onPress={() => onPress(place.id)} activeOpacity={0.75}>
        <PinCard style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {place.name}
                </Text>
                {place.isFavorite && <Text style={styles.heart}>♥</Text>}
              </View>
              <View style={styles.meta}>
                <PinChip
                  label={CATEGORY_LABELS[place.category]}
                  color={CATEGORY_COLORS[place.category]}
                  selected
                />
                <PinRatingView rating={place.rating} size={12} />
              </View>
              <Text style={styles.date}>
                {new Date(place.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </PinCard>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s4,
    marginBottom: Spacing.s4,
  },
  name: { ...Typography.headline, color: Colors.neutral[900], flex: 1 },
  heart: { fontSize: 14, color: Colors.accent.primary },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  date: { ...Typography.caption, color: Colors.neutral[400] },
  chevron: { fontSize: 22, color: Colors.neutral[300], marginLeft: Spacing.s8 },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: Radii.md,
    marginLeft: Spacing.s8,
  },
  deleteActionText: { color: Colors.white, fontWeight: "600", fontSize: 14 },
});
