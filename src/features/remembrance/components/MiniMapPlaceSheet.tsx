import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { PinButton } from '../../../design-system/components/PinButton';
import { PlaceFlagBadges } from '../../../design-system/components/PlaceFlags';
import { PlaceInfoRows } from '../../../design-system/components/PlaceInfoRows';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MOOD_CONFIG, Place } from '../../../models/types';
import { categoryColor, categoryIcon } from '../../../shared/constants';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { PlacePhotoPreview } from '../../map/utils/placePhoto';

interface Props {
  // null closes the sheet — the caller owns "which pin is selected", so there is no separate
  // visible flag to keep in step with it.
  place: Place | null;
  preview: PlacePhotoPreview | null;
  onOpenDetails: () => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MiniMapPlaceSheet({ place, preview, onOpenDetails, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const notes = usePlacesStore((s) => s.notes);
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);

  const mood = place ? getLatestMoodForPlace(place.id) : undefined;
  const memoryCount = useMemo(
    () => (place ? notes.filter((n) => n.placeId === place.id).length : 0),
    [notes, place],
  );

  const handleBackdropPress = useCallback(() => onClose(), [onClose]);

  if (!place) return null;

  const accentColor = mood
    ? MOOD_CONFIG[mood].color
    : (place.pinColor ?? categoryColor(place.category));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.s16 }]}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.headerRow}>
              {preview ? (
                <Image source={{ uri: preview.photoUri }} style={styles.photo} contentFit="cover" />
              ) : (
                <View
                  style={[styles.photo, styles.photoEmpty, { backgroundColor: accentColor + '1F' }]}
                >
                  <Ionicons name={categoryIcon(place.category)} size={26} color={accentColor} />
                </View>
              )}
              <View style={styles.headerText}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <PlaceFlagBadges favorite={place.favorite} wantToVisit={place.isFavorite} />
                </View>
                {mood && (
                  <Text style={styles.mood}>
                    {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
                  </Text>
                )}
              </View>
              <CircleCloseButton onPress={onClose} />
            </View>

            {!!place.description && <Text style={styles.description}>{place.description}</Text>}

            {place.tags && place.tags.length > 0 && (
              <Text style={styles.tags} numberOfLines={2}>
                {place.tags.map((tag) => `#${tag}`).join('  ')}
              </Text>
            )}

            <View style={styles.infoBlock}>
              <PlaceInfoRows
                info={{
                  address: place.address,
                  phone: place.phone,
                  website: place.website,
                  latitude: place.coordinates.latitude,
                  longitude: place.coordinates.longitude,
                }}
                compact
              />
            </View>

            <View style={styles.factsRow}>
              <Fact value={String(place.visitCount ?? 0)} label="visits" />
              <Fact value={String(memoryCount)} label={memoryCount === 1 ? 'memory' : 'memories'} />
              <Fact value={formatDate(place.createdAt)} label="added" />
            </View>

            <PinButton title="Open place" onPress={onOpenDetails} fullWidth />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    maxHeight: '80%',
  },
  handleRow: { alignItems: 'center', paddingTop: Spacing.s8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.neutral[200] },
  content: { padding: Spacing.s16, gap: Spacing.s12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.s12 },
  photo: { width: 64, height: 64, borderRadius: Radii.sm, backgroundColor: Colors.neutral[100] },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: Spacing.s4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s4 },
  name: { ...Typography.title3, color: Colors.neutral[900], flexShrink: 1 },
  mood: { ...Typography.caption, color: Colors.neutral[600] },
  description: { ...Typography.body, color: Colors.neutral[700] },
  tags: { ...Typography.caption, color: Colors.brand.primary },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: Spacing.s12,
  },
  factsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: Spacing.s12,
  },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factValue: { ...Typography.headline, color: Colors.neutral[900] },
  factLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
