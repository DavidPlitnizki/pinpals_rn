import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinButton } from '../../design-system/components/PinButton';
import { PinCard } from '../../design-system/components/PinCard';
import { PinColorPicker } from '../../design-system/components/PinColorPicker';
import { PinTextField } from '../../design-system/components/PinTextField';
import { PhotoViewerModal } from '../../design-system/components/PhotoViewerModal';
import { TagPicker } from '../../design-system/components/TagPicker';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { PlaceNote, MOOD_CONFIG } from '../../models/types';
import { categoryColor, PRESET_TAGS } from '../../shared/constants';
import { AddNoteModal } from './components/AddNoteModal';
import { MemoryTimelineItem } from './components/MemoryTimelineItem';
import { PlaceMapSnapshot } from './components/PlaceMapSnapshot';
import { usePlaceDetail } from './hooks/usePlaceDetail';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export default function PlaceDetailScreen() {
  const {
    place,
    placeNotes,
    latestMood,
    isEditingDescription,
    description,
    setDescription,
    showAddNote,
    noteText,
    setNoteText,
    notePhotoUri,
    handleRemoveNotePhoto,
    viewerPhotos,
    viewerIndex,
    viewerVisible,
    handleOpenPhotoViewer,
    handleClosePhotoViewer,
    deleteNotePhoto,
    handleToggleEditDescription,
    handleToggleFavorite,
    handleSetPinColor,
    handleDeletePlace,
    handlePickPhoto,
    handleSaveNote,
    handleDeleteNote,
    handleCloseAddNote,
    handleAddMemory,
    handleEditMemory,
    handleToggleTag,
    isEditingName,
    name,
    setName,
    handleStartEditingName,
    handleSaveName,
    router,
  } = usePlaceDetail();

  const navigation = useNavigation();
  // The Stack header defaults to "Place Details" (set in the root layout) — swap it to
  // "Edit" while the description field is open, back to the default once it closes.
  useEffect(() => {
    navigation.setOptions({ title: isEditingDescription ? 'Edit' : 'Place Details' });
  }, [isEditingDescription, navigation]);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Place not found</Text>
          <PinButton title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const moodConfig = latestMood ? MOOD_CONFIG[latestMood] : null;
  const headerPhoto =
    placeNotes.find((n) => n.photoUri || n.photoUris?.length)?.photoUris?.[0] ??
    placeNotes.find((n) => n.photoUri)?.photoUri;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Hero: photo or map */}
        {headerPhoto ? (
          <View style={styles.heroContainer}>
            <Image source={{ uri: headerPhoto }} style={styles.heroPhoto} />
            <View
              style={[
                styles.heroOverlay,
                moodConfig && { backgroundColor: moodConfig.color + '40' },
              ]}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroName}>{place.name}</Text>
              {moodConfig && (
                <Text style={styles.heroMood}>
                  {moodConfig.emoji} {moodConfig.label}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <PlaceMapSnapshot
            id={place.id}
            latitude={place.coordinates.latitude}
            longitude={place.coordinates.longitude}
            color={moodConfig?.color ?? place.pinColor ?? categoryColor(place.category)}
          />
        )}

        <View style={styles.content}>
          {/* Header info */}
          <View style={styles.placeHeader}>
            <View style={styles.titleRow}>
              {isEditingName ? (
                <View style={styles.nameField}>
                  <PinTextField
                    value={name}
                    onChangeText={setName}
                    placeholder="Place name"
                    autoFocus
                    onSubmitEditing={handleSaveName}
                    returnKeyType="done"
                  />
                </View>
              ) : (
                <Text style={styles.placeName}>{place.name}</Text>
              )}
              <TouchableOpacity
                onPress={isEditingName ? handleSaveName : handleStartEditingName}
                style={styles.iconButton}
                hitSlop={HIT_SLOP}
                accessibilityLabel={isEditingName ? 'Save name' : 'Rename place'}
              >
                <Ionicons
                  name={isEditingName ? 'checkmark' : 'pencil'}
                  size={20}
                  color={Colors.brand.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Text style={[styles.heartIcon, place.isFavorite && styles.heartIconActive]}>
                  {place.isFavorite ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>

            {place.visitCount > 0 && (
              <Text style={styles.visitText}>
                {place.visitCount} {place.visitCount === 1 ? 'visit' : 'visits'}
              </Text>
            )}
          </View>

          {/* Tags */}
          <PinCard style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <TagPicker tags={place.tags || []} options={PRESET_TAGS} onToggle={handleToggleTag} />
          </PinCard>

          {/* Pin color */}
          <PinCard style={styles.section}>
            <Text style={styles.sectionTitle}>Pin Color</Text>
            <PinColorPicker selected={place.pinColor} onSelect={handleSetPinColor} />
          </PinCard>

          {/* Description */}
          <PinCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity
                onPress={handleToggleEditDescription}
                style={styles.iconButton}
                hitSlop={HIT_SLOP}
                accessibilityLabel={isEditingDescription ? 'Save description' : 'Edit description'}
              >
                <Ionicons
                  name={isEditingDescription ? 'checkmark' : 'pencil'}
                  size={20}
                  color={Colors.brand.primary}
                />
              </TouchableOpacity>
            </View>
            {isEditingDescription ? (
              <PinTextField
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                multiline
              />
            ) : (
              <Text style={[styles.descriptionText, !place.description && styles.placeholderText]}>
                {place.description || 'No description. Tap Edit to add one.'}
              </Text>
            )}
          </PinCard>

          {/* Action buttons */}
          <View style={styles.actions}>
            <PinButton title="Add Memory" onPress={handleAddMemory} fullWidth />
          </View>

          {/* Timeline of memories */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Memories ({placeNotes.length})</Text>

            {placeNotes.length === 0 ? (
              <PinCard>
                <Text style={styles.placeholderText}>No memories yet. Add the first one!</Text>
              </PinCard>
            ) : (
              <View style={styles.timeline}>
                {placeNotes.map((note: PlaceNote, index: number) => (
                  <MemoryTimelineItem
                    key={note.id}
                    note={note}
                    isLast={index === placeNotes.length - 1}
                    onPhotoPress={handleOpenPhotoViewer}
                    onDeletePhoto={deleteNotePhoto}
                    onEdit={handleEditMemory}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Delete */}
          <View style={styles.dangerZone}>
            <PinButton
              title="Delete Place"
              onPress={handleDeletePlace}
              variant="danger"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Mounted only while open: an always-mounted native Modal re-attaches its view on
          every re-render, which drops the focused TextInput's first responder mid-typing. */}
      {showAddNote && (
        <AddNoteModal
          visible={showAddNote}
          noteText={noteText}
          notePhotoUri={notePhotoUri}
          onChangeText={setNoteText}
          onPickPhoto={handlePickPhoto}
          onRemovePhoto={handleRemoveNotePhoto}
          onSave={handleSaveNote}
          onClose={handleCloseAddNote}
        />
      )}

      {viewerVisible && (
        <PhotoViewerModal
          visible={viewerVisible}
          photoUris={viewerPhotos}
          initialIndex={viewerIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s16,
  },
  notFoundText: { ...Typography.title3, color: Colors.neutral[600] },

  // Hero
  heroContainer: {
    height: 260,
    position: 'relative',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.s16,
    left: Spacing.s16,
    right: Spacing.s16,
  },
  heroName: {
    ...Typography.title1,
    color: Colors.white,
  },
  heroMood: {
    ...Typography.body,
    color: Colors.white,
    marginTop: Spacing.s4,
  },

  mapSnapshot: { height: 200, width: '100%' },
  content: { padding: Spacing.s16, gap: Spacing.s16 },

  // Header
  placeHeader: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginBottom: Spacing.s12,
  },
  placeName: {
    ...Typography.title2,
    color: Colors.neutral[900],
    flex: 1,
  },
  nameField: { flex: 1 },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.light,
  },
  favoriteButton: { padding: Spacing.s4 },
  heartIcon: { fontSize: 24, color: Colors.neutral[300] },
  heartIconActive: { color: Colors.accent.primary },
  visitText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.s8,
  },

  // Sections
  section: { marginBottom: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s8,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s8,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.neutral[700],
    lineHeight: 24,
  },
  placeholderText: { color: Colors.neutral[400], fontStyle: 'italic' },

  // Actions
  actions: {
    gap: Spacing.s8,
  },

  // Timeline
  notesSection: { gap: Spacing.s8 },
  timeline: {
    gap: 0,
  },

  dangerZone: { paddingTop: Spacing.s8, paddingBottom: Spacing.s32 },
});
