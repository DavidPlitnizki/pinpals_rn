import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Typography } from "../tokens";
import { PlaceNote, MOOD_CONFIG } from "../../models/types";

interface MemoryCardProps {
  note: PlaceNote;
  onPress?: () => void;
}

export function MemoryCard({ note, onPress }: MemoryCardProps) {
  const moodConfig = note.mood ? MOOD_CONFIG[note.mood] : null;
  const photoUri = note.photoUris?.[0] ?? note.photoUri;

  const content = (
    <View
      style={[
        styles.container,
        moodConfig && { borderLeftColor: moodConfig.color, borderLeftWidth: 3 },
      ]}
    >
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      )}

      <View style={styles.body}>
        {moodConfig && (
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
            <Text style={[styles.moodLabel, { color: moodConfig.color }]}>
              {moodConfig.label}
            </Text>
          </View>
        )}

        {note.text ? (
          <Text style={styles.text} numberOfLines={3}>
            {note.text}
          </Text>
        ) : null}

        {note.companions.length > 0 && (
          <View style={styles.companionsRow}>
            <Text style={styles.companionsIcon}>👥</Text>
            <Text style={styles.companionsText} numberOfLines={1}>
              {note.companions.join(", ")}
            </Text>
          </View>
        )}

        <Text style={styles.date}>
          {new Date(note.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    overflow: "hidden",
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  photo: {
    width: "100%",
    height: 160,
  },
  body: {
    padding: Spacing.s12,
    gap: Spacing.s8,
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s4,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    ...Typography.caption,
    fontWeight: "600",
  },
  text: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  companionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s4,
  },
  companionsIcon: {
    fontSize: 12,
  },
  companionsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  date: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
