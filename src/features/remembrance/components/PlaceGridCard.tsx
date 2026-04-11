import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MOOD_CONFIG, Place } from '../../../models/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { InlineTags } from './InlineTags';

interface Props {
  place: Place;
  onPress: (id: string) => void;
  allTags?: string[];
}

export function PlaceGridCard({ place, onPress, allTags = [] }: Props) {
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const { addTagToPlace, removeTagFromPlace } = usePlacesStore();
  const mood = getLatestMoodForPlace(place.id);
  const accentColor = mood ? MOOD_CONFIG[mood].color : CATEGORY_COLORS[place.category];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(place.id)} activeOpacity={0.75}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          {place.isFavorite && <Text style={styles.heart}>♥</Text>}
        </View>
        <View style={styles.categoryRow}>
          <View style={[styles.chip, { backgroundColor: accentColor + '22' }]}>
            <Text style={[styles.chipText, { color: accentColor }]}>
              {CATEGORY_LABELS[place.category]}
            </Text>
          </View>
          {mood && <Text style={styles.moodEmoji}>{MOOD_CONFIG[mood].emoji}</Text>}
        </View>
        {place.visitCount > 0 && <Text style={styles.visits}>{place.visitCount}× визит</Text>}

        {/* Inline tags — stop propagation so chip taps don't open detail */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <InlineTags
            tags={place.tags ?? []}
            allTags={allTags}
            onAdd={(tag) => addTagToPlace(place.id, tag)}
            onRemove={(tag) => removeTagFromPlace(place.id, tag)}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: {
    height: 4,
  },
  body: {
    padding: Spacing.s12,
    gap: Spacing.s4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s4,
  },
  name: {
    ...Typography.headline,
    color: Colors.neutral[900],
    flex: 1,
  },
  heart: {
    fontSize: 13,
    color: Colors.accent.primary,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
  },
  chip: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  moodEmoji: {
    fontSize: 14,
  },
  visits: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
});
