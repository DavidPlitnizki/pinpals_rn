import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { PinCard } from '../../../design-system/components/PinCard';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { PlaceFlagBadges } from '../../../design-system/components/PlaceFlags';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { usePlaceCoverImage } from '../../../hooks/usePlaceCoverImage';
import { MOOD_CONFIG, Place } from '../../../models/types';
import { categoryColor, categoryIcon } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { InlineTags } from './InlineTags';

function noop() {}

interface Props {
  place: Place;
  onPress: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function PlaceRow({ place, onPress, onDelete }: Props) {
  // Field selectors, not the whole store: destructuring usePlacesStore() subscribes the row
  // to every change in it, so adding a note anywhere re-rendered every row in the list.
  const addTagToPlace = usePlacesStore((s) => s.addTagToPlace);
  const removeTagFromPlace = usePlacesStore((s) => s.removeTagFromPlace);
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);

  // The same cover the grid cards use, not just the user's own photos: the full cascade also
  // falls back to a Wikipedia image or a map crop. Using the narrower lookup here meant a
  // place showed a picture as a grid tile and a blank square as a list row.
  const cover = usePlaceCoverImage(place);
  const mood = getLatestMoodForPlace(place.id);
  const accentColor = mood
    ? MOOD_CONFIG[mood].color
    : (place.pinColor ?? categoryColor(place.category));

  const handlePress = useCallback(() => onPress(place.id), [onPress, place.id]);
  const handleDelete = useCallback(
    () => onDelete(place.id, place.name),
    [onDelete, place.id, place.name],
  );
  const handleAddTag = useCallback(
    (tag: string) => addTagToPlace(place.id, tag),
    [addTagToPlace, place.id],
  );
  const handleRemoveTag = useCallback(
    (tag: string) => removeTagFromPlace(place.id, tag),
    [removeTagFromPlace, place.id],
  );
  const renderRightActions = useCallback(
    () => (
      <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    ),
    [handleDelete],
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.75}>
        <PinCard style={styles.card}>
          <View style={styles.row}>
            {/* A thumbnail, not a full-width hero: the row is a scannable list entry, and a
                place with no picture still needs to occupy the same height as one with. */}
            {cover.uri ? (
              <Image source={{ uri: cover.uri }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View
                style={[styles.thumb, styles.thumbEmpty, { backgroundColor: accentColor + '1F' }]}
              >
                <Ionicons name={categoryIcon(place.category)} size={20} color={accentColor} />
              </View>
            )}
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {place.name}
                </Text>
                <PlaceFlagBadges
                  favorite={place.favorite}
                  wantToVisit={place.isFavorite}
                  size={18}
                />
              </View>
              <View style={styles.meta}>
                <PinRatingView rating={place.rating} size={12} />
              </View>
              <Text style={styles.date}>
                {new Date(place.createdAt).toLocaleDateString('en-US')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={Colors.neutral[300]}
              style={styles.chevron}
            />
          </View>

          {/* Inline tags — stop propagation so tapping chips doesn't open detail */}
          <TouchableOpacity activeOpacity={1} onPress={noop}>
            <InlineTags tags={place.tags ?? []} onAdd={handleAddTag} onRemove={handleRemoveTag} />
          </TouchableOpacity>
        </PinCard>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    marginBottom: Spacing.s8,
  },
  thumb: { width: 56, height: 56, borderRadius: Radii.sm, backgroundColor: Colors.neutral[100] },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    marginBottom: Spacing.s4,
  },
  name: { ...Typography.headline, color: Colors.neutral[900], flex: 1 },
  heart: { fontSize: 14, color: Colors.accent.primary },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  date: { ...Typography.caption, color: Colors.neutral[400] },
  chevron: { marginLeft: Spacing.s8, alignSelf: 'center' },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Radii.md,
    marginLeft: Spacing.s8,
  },
  deleteActionText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});
