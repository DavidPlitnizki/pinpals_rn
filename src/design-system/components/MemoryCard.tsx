import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';
import { PlaceNote, MOOD_CONFIG } from '../../models/types';

interface MemoryCardProps {
  note: PlaceNote;
  onPress?: () => void;
  onPhotoPress?: (photoUris: string[], index: number) => void;
  onDeletePhoto?: (photoUri: string) => void;
}

interface PhotoTileProps {
  uri: string;
  index: number;
  photoUris: string[];
  style?: StyleProp<ViewStyle>;
  overlayCount?: number;
  onPhotoPress?: (photoUris: string[], index: number) => void;
  onLongPressPhoto: (uri: string) => void;
}

const PhotoTile = React.memo(function PhotoTile({
  uri,
  index,
  photoUris,
  style,
  overlayCount,
  onPhotoPress,
  onLongPressPhoto,
}: PhotoTileProps) {
  const handlePress = useCallback(
    () => onPhotoPress?.(photoUris, index),
    [onPhotoPress, photoUris, index],
  );
  const handleLongPress = useCallback(() => onLongPressPhoto(uri), [onLongPressPhoto, uri]);

  return (
    <TouchableOpacity
      style={style}
      activeOpacity={0.85}
      onPress={handlePress}
      onLongPress={overlayCount ? undefined : handleLongPress}
    >
      <Image source={{ uri }} style={style ? styles.photoGridImage : styles.photo} />
      {overlayCount ? (
        <View style={styles.photoMoreOverlay}>
          <Text style={styles.photoMoreText}>+{overlayCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

export function MemoryCard({ note, onPress, onPhotoPress, onDeletePhoto }: MemoryCardProps) {
  const moodConfig = note.mood ? MOOD_CONFIG[note.mood] : null;
  const photoUris = note.photoUris?.length ? note.photoUris : note.photoUri ? [note.photoUri] : [];

  const handleLongPressPhoto = useCallback(
    (uri: string) => {
      if (!onDeletePhoto) return;
      Alert.alert('Delete photo', 'Delete this photo from the memory?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeletePhoto(uri) },
      ]);
    },
    [onDeletePhoto],
  );

  const content = (
    <View
      style={[
        styles.container,
        moodConfig && { borderLeftColor: moodConfig.color, borderLeftWidth: 3 },
      ]}
    >
      {photoUris.length === 1 && (
        <PhotoTile
          uri={photoUris[0]}
          index={0}
          photoUris={photoUris}
          onPhotoPress={onPhotoPress}
          onLongPressPhoto={handleLongPressPhoto}
        />
      )}
      {photoUris.length > 1 && photoUris.length <= 3 && (
        <View style={styles.photoGrid}>
          {photoUris.map((uri, index) => (
            <PhotoTile
              key={uri}
              uri={uri}
              index={index}
              photoUris={photoUris}
              style={styles.photoGridItem}
              onPhotoPress={onPhotoPress}
              onLongPressPhoto={handleLongPressPhoto}
            />
          ))}
        </View>
      )}
      {photoUris.length > 3 && (
        <View style={styles.photoGrid}>
          {photoUris.slice(0, 2).map((uri, index) => (
            <PhotoTile
              key={uri}
              uri={uri}
              index={index}
              photoUris={photoUris}
              style={styles.photoGridItem}
              onPhotoPress={onPhotoPress}
              onLongPressPhoto={handleLongPressPhoto}
            />
          ))}
          <PhotoTile
            uri={photoUris[2]}
            index={2}
            photoUris={photoUris}
            style={styles.photoGridItem}
            overlayCount={photoUris.length - 2}
            onPhotoPress={onPhotoPress}
            onLongPressPhoto={handleLongPressPhoto}
          />
        </View>
      )}

      <View style={styles.body}>
        {moodConfig && (
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
            <Text style={[styles.moodLabel, { color: moodConfig.color }]}>{moodConfig.label}</Text>
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
              {note.companions.join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.date}>
          {new Date(note.createdAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
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
    overflow: 'hidden',
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 160,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  photoGridItem: {
    width: '49.5%',
    height: 120,
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMoreText: {
    ...Typography.title2,
    color: Colors.white,
    fontWeight: '700',
  },
  body: {
    padding: Spacing.s12,
    gap: Spacing.s8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  text: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  companionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
