import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radii, Spacing, Typography } from "../tokens";
import {
  MemoryMood,
  MEMORY_MOODS,
  MOOD_CONFIG,
} from "../../models/types";

interface MoodPickerProps {
  selected?: MemoryMood;
  onSelect: (mood: MemoryMood) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <FlatList
      data={MEMORY_MOODS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const config = MOOD_CONFIG[item];
        const isSelected = selected === item;
        return (
          <TouchableOpacity
            style={[
              styles.item,
              {
                backgroundColor: isSelected ? config.color : Colors.neutral[50],
                borderColor: isSelected ? config.color : Colors.neutral[200],
              },
            ]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{config.emoji}</Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? Colors.white : Colors.text.primary },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s8,
  },
  item: {
    alignItems: "center",
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    minWidth: 80,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.s4,
  },
  label: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
