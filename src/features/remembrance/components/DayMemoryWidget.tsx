import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../../shared/constants';
import { MOOD_CONFIG } from '../../../models/types';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { DayMemory } from '../hooks/useRemembranceScreen';

interface Props {
  memory: DayMemory;
  onPress: (id: string) => void;
}

export function DayMemoryWidget({ memory, onPress }: Props) {
  const { place, note, label } = memory;
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const mood = getLatestMoodForPlace(place.id);
  const accentColor = mood ? MOOD_CONFIG[mood].color : CATEGORY_COLORS[place.category];

  // Subtle shimmer / pulse animation on the accent bar
  const pulse = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const photoUri =
    note?.photoUri ?? (note?.photoUris && note.photoUris.length > 0 ? note.photoUris[0] : null);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(place.id)}
      activeOpacity={0.82}
    >
      {/* Left accent bar */}
      <Animated.View style={[styles.accentBar, { backgroundColor: accentColor, opacity: pulse }]} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Воспоминание дня</Text>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.timeLabel}>{label}</Text>
          {mood && (
            <Text style={styles.moodBadge}>
              {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
            </Text>
          )}
          {!mood && (
            <View style={[styles.categoryChip, { backgroundColor: accentColor + '22' }]}>
              <Text style={[styles.categoryChipText, { color: accentColor }]}>
                {CATEGORY_LABELS[place.category]}
              </Text>
            </View>
          )}
        </View>
        {note?.text ? (
          <Text style={styles.noteText} numberOfLines={2}>
            "{note.text}"
          </Text>
        ) : null}
      </View>

      {/* Photo or color placeholder */}
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: accentColor + '33' }]}>
          <Text style={styles.photoPlaceholderEmoji}>
            {mood ? MOOD_CONFIG[mood].emoji : '📍'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s12,
    gap: Spacing.s4,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  placeName: {
    ...Typography.headline,
    color: Colors.neutral[900],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  timeLabel: {
    ...Typography.footnote,
    color: Colors.neutral[500],
  },
  moodBadge: {
    ...Typography.footnote,
    color: Colors.neutral[600],
  },
  categoryChip: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  categoryChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  noteText: {
    ...Typography.footnote,
    color: Colors.neutral[500],
    fontStyle: 'italic',
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: Radii.sm,
    margin: Spacing.s12,
    marginLeft: 0,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: Radii.sm,
    margin: Spacing.s12,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderEmoji: {
    fontSize: 28,
  },
});
