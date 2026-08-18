import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MemoryCard } from '../../../design-system/components/MemoryCard';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MOOD_CONFIG, PlaceNote } from '../../../models/types';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

interface Props {
  note: PlaceNote;
  isLast: boolean;
  onPhotoPress: (photoUris: string[], index: number) => void;
  onDeletePhoto: (noteId: string, photoUri: string) => void;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

// Memoized so typing in the screen's name/description fields doesn't re-render the whole
// memory timeline (photos included) on every keystroke.
export const MemoryTimelineItem = React.memo(function MemoryTimelineItem({
  note,
  isLast,
  onPhotoPress,
  onDeletePhoto,
  onEdit,
  onDelete,
}: Props) {
  const handleDeletePhoto = useCallback(
    (uri: string) => onDeletePhoto(note.id, uri),
    [onDeletePhoto, note.id],
  );
  const handleEdit = useCallback(() => onEdit(note.id), [onEdit, note.id]);
  const handleDelete = useCallback(() => onDelete(note.id), [onDelete, note.id]);

  const dotStyle = useMemo(
    () => [styles.dot, note.mood ? { backgroundColor: MOOD_CONFIG[note.mood].color } : null],
    [note.mood],
  );

  return (
    <View style={styles.item}>
      <View style={styles.line}>
        <View style={dotStyle} />
        {!isLast && <View style={styles.connector} />}
      </View>

      <View style={styles.card}>
        <MemoryCard note={note} onPhotoPress={onPhotoPress} onDeletePhoto={handleDeletePhoto} />
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleEdit}
            hitSlop={HIT_SLOP}
            accessibilityLabel="Edit memory"
          >
            <Ionicons name="pencil" size={16} color={Colors.brand.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={HIT_SLOP}
            accessibilityLabel="Delete memory"
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  line: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brand.primary,
    marginTop: Spacing.s4,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.s4,
  },
  card: {
    flex: 1,
    marginBottom: Spacing.s12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.s12,
    marginTop: Spacing.s4,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.light,
  },
  deleteButton: { paddingVertical: Spacing.s2 },
  deleteText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
});
