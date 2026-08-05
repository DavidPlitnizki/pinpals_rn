import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { PinCard } from '../../../design-system/components/PinCard';
import { PinChip } from '../../../design-system/components/PinChip';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place } from '../../../models/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { InlineTags } from './InlineTags';

function noop() {}

interface Props {
  place: Place;
  onPress: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  allTags?: string[];
}

export function PlaceRow({ place, onPress, onDelete, allTags = [] }: Props) {
  const { addTagToPlace, removeTagFromPlace } = usePlacesStore();

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
              <Text style={styles.date}>{new Date(place.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* Inline tags — stop propagation so tapping chips doesn't open detail */}
          <TouchableOpacity activeOpacity={1} onPress={noop}>
            <InlineTags
              tags={place.tags ?? []}
              allTags={allTags}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
            />
          </TouchableOpacity>
        </PinCard>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.s8 },
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
  chevron: { fontSize: 22, color: Colors.neutral[300], marginLeft: Spacing.s8 },
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
