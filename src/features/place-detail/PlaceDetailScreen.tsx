import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { PlaceFlagToggle } from '../../design-system/components/PlaceFlags';
import { PlaceInfoRows } from '../../design-system/components/PlaceInfoRows';
import { shareSpot } from '../../shared/sharePlace';
import { AddNoteModal } from './components/AddNoteModal';
import { FullScreenMapModal } from './components/FullScreenMapModal';
import { PlaceHeroGallery } from './components/PlaceHeroGallery';
import { MemoryTimelineItem } from './components/MemoryTimelineItem';
import { usePlaceDetail } from './hooks/usePlaceDetail';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Created once at module level — an inline element would be a new object on every render.
const ADD_MEMORY_ICON = <Ionicons name="add-circle-outline" size={20} color={Colors.white} />;
const DELETE_PLACE_ICON = <Ionicons name="trash-outline" size={20} color={Colors.white} />;

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
    handleToggleWantToVisit,
    handleSetPinColor,
    handleDeletePlace,
    handlePickPhoto,
    handleSaveNote,
    handleDeleteNote,
    handleCloseAddNote,
    handleAddMemory,
    handleEditMemory,
    handleOpenOnMap,
    handleRecordVisit,
    handleToggleTag,
    isEditingName,
    name,
    setName,
    handleStartEditingName,
    handleSaveName,
    router,
  } = usePlaceDetail();

  const [fullScreenMapVisible, setFullScreenMapVisible] = useState(false);
  const openFullScreenMap = useCallback(() => setFullScreenMapVisible(true), []);
  const closeFullScreenMap = useCallback(() => setFullScreenMapVisible(false), []);

  // Every photo across the place's memories, oldest note first — the map page is appended
  // last by the gallery itself.
  const galleryPhotos = useMemo(
    () =>
      placeNotes
        .slice()
        .reverse()
        .flatMap((note: PlaceNote) => note.photoUris ?? (note.photoUri ? [note.photoUri] : [])),
    [placeNotes],
  );

  const placeInfo = useMemo(
    () => ({
      address: place?.address,
      phone: place?.phone,
      website: place?.website,
      latitude: place?.coordinates.latitude,
      longitude: place?.coordinates.longitude,
    }),
    [place?.address, place?.phone, place?.website, place?.coordinates],
  );

  // Shares the same payload the map callout's share button sends — name, address,
  // coordinates and a Google Maps link — so a place shared from here and from the map look
  // identical to whoever receives it.
  const handleShare = useCallback(() => {
    if (!place) return;
    shareSpot({
      name: place.name,
      coordinates: place.coordinates,
      address: place.address,
      photoUri: galleryPhotos[0] ?? place.mainPhotoUri,
    });
  }, [place, galleryPhotos]);

  const navigation = useNavigation();
  // The Stack header defaults to "Place Details" (set in the root layout) — swap it to
  // "Edit" while the description field is open, back to the default once it closes. The
  // share action lives in the header rather than the page body so it stays reachable
  // without scrolling.
  useEffect(() => {
    navigation.setOptions({
      title: isEditingDescription ? 'Edit' : 'Place Details',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          hitSlop={HIT_SLOP}
          accessibilityLabel="Share this place"
        >
          <Ionicons name="share-outline" size={22} color={Colors.brand.primary} />
        </TouchableOpacity>
      ),
    });
  }, [isEditingDescription, navigation, handleShare]);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PlaceHeroGallery
          placeId={place.id}
          latitude={place.coordinates.latitude}
          longitude={place.coordinates.longitude}
          pinColor={moodConfig?.color ?? place.pinColor ?? categoryColor(place.category)}
          photoUris={galleryPhotos}
          name={place.name}
          moodLabel={moodConfig ? `${moodConfig.emoji} ${moodConfig.label}` : undefined}
          onPhotoPress={handleOpenPhotoViewer}
          onMapPress={openFullScreenMap}
        />

        {/* Straight under the map: jump to this pin on the main map, or log a visit without
            having to write a memory for it. */}
        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapAction} onPress={handleOpenOnMap} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={18} color={Colors.brand.primary} />
            <Text style={styles.mapActionText}>Open on map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapAction}
            onPress={handleRecordVisit}
            activeOpacity={0.8}
          >
            <Ionicons name="footsteps-outline" size={18} color={Colors.brand.primary} />
            <Text style={styles.mapActionText}>
              {place.visitCount > 0 ? `I was here · ${place.visitCount}×` : 'I was here'}
            </Text>
          </TouchableOpacity>
        </View>

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
              <PlaceFlagToggle
                flag="favorite"
                active={!!place.favorite}
                onPress={handleToggleFavorite}
              />
              <PlaceFlagToggle
                flag="wantToVisit"
                active={place.isFavorite}
                onPress={handleToggleWantToVisit}
              />
            </View>

            {place.visitCount > 0 && (
              <Text style={styles.visitText}>
                {place.visitCount} {place.visitCount === 1 ? 'visit' : 'visits'}
              </Text>
            )}
          </View>

          {/* Details — address/phone/website/coordinates, whichever the place actually has */}
          <PinCard style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <PlaceInfoRows info={placeInfo} />
          </PinCard>

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
            <PinButton
              title="Add Memory"
              onPress={handleAddMemory}
              fullWidth
              leftIcon={ADD_MEMORY_ICON}
            />
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
              leftIcon={DELETE_PLACE_ICON}
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

      {fullScreenMapVisible && (
        <FullScreenMapModal
          visible={fullScreenMapVisible}
          placeId={place.id}
          latitude={place.coordinates.latitude}
          longitude={place.coordinates.longitude}
          pinColor={moodConfig?.color ?? place.pinColor ?? categoryColor(place.category)}
          name={place.name}
          onClose={closeFullScreenMap}
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
  mapActions: {
    flexDirection: 'row',
    gap: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    paddingTop: Spacing.s12,
  },
  mapAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    backgroundColor: Colors.white,
  },
  mapActionText: {
    ...Typography.subheadline,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
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
