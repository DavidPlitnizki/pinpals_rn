import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinButton } from "../../design-system/components/PinButton";
import { PinCard } from "../../design-system/components/PinCard";
import { PinChip } from "../../design-system/components/PinChip";
import { PinTextField } from "../../design-system/components/PinTextField";
import { MemoryCard } from "../../design-system/components/MemoryCard";
import { TagInput } from "../../design-system/components/TagInput";
import { Colors, Radii, Spacing, Typography } from "../../design-system/tokens";
import { PlaceNote, MOOD_CONFIG } from "../../models/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../shared/constants";
import { AddNoteModal } from "./components/AddNoteModal";
import { usePlaceDetail } from "./hooks/usePlaceDetail";

export default function PlaceDetailScreen() {
  const {
    place,
    placeNotes,
    latestMood,
    isEditingDescription,
    setIsEditingDescription,
    description,
    setDescription,
    showAddNote,
    setShowAddNote,
    noteText,
    setNoteText,
    notePhotoUri,
    setNotePhotoUri,
    handleSaveDescription,
    handleToggleFavorite,
    handleDeletePlace,
    handlePickPhoto,
    handleSaveNote,
    handleDeleteNote,
    handleCloseAddNote,
    handleAddMemory,
    handleCreateMeetingHere,
    handleAddTag,
    handleRemoveTag,
    router,
  } = usePlaceDetail();

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
  const headerPhoto = placeNotes.find((n) => n.photoUri || n.photoUris?.length)
    ?.photoUris?.[0] ?? placeNotes.find((n) => n.photoUri)?.photoUri;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero: photo or map */}
        {headerPhoto ? (
          <View style={styles.heroContainer}>
            <Image source={{ uri: headerPhoto }} style={styles.heroPhoto} />
            <View
              style={[
                styles.heroOverlay,
                moodConfig && { backgroundColor: moodConfig.color + "40" },
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
          <MapView
            style={styles.mapSnapshot}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Camera
              centerCoordinate={[
                place.coordinates.longitude,
                place.coordinates.latitude,
              ]}
              zoomLevel={15}
              animationDuration={0}
            />
            <PointAnnotation
              id={place.id}
              coordinate={[
                place.coordinates.longitude,
                place.coordinates.latitude,
              ]}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: moodConfig?.color ?? CATEGORY_COLORS[place.category],
                  borderWidth: 2,
                  borderColor: "#fff",
                }}
              />
            </PointAnnotation>
          </MapView>
        )}

        <View style={styles.content}>
          {/* Header info */}
          <View style={styles.placeHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.placeName}>{place.name}</Text>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Text style={[styles.heartIcon, place.isFavorite && styles.heartIconActive]}>
                  {place.isFavorite ? "♥" : "♡"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metaRow}>
              <PinChip
                label={CATEGORY_LABELS[place.category]}
                color={CATEGORY_COLORS[place.category]}
                selected
              />
              {place.visitCount > 0 && (
                <Text style={styles.visitText}>
                  {place.visitCount} {place.visitCount === 1 ? "визит" : "визитов"}
                </Text>
              )}
            </View>
          </View>

          {/* Tags */}
          <PinCard style={styles.section}>
            <Text style={styles.sectionTitle}>Теги</Text>
            <TagInput
              tags={place.tags || []}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
            />
          </PinCard>

          {/* Description */}
          <PinCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Описание</Text>
              <TouchableOpacity
                onPress={() => {
                  if (isEditingDescription) {
                    handleSaveDescription();
                  } else {
                    setIsEditingDescription(true);
                  }
                }}
              >
                <Text style={styles.editButton}>
                  {isEditingDescription ? "Сохранить" : "Изменить"}
                </Text>
              </TouchableOpacity>
            </View>
            {isEditingDescription ? (
              <PinTextField
                value={description}
                onChangeText={setDescription}
                placeholder="Добавьте описание..."
                multiline
              />
            ) : (
              <Text
                style={[
                  styles.descriptionText,
                  !place.description && styles.placeholderText,
                ]}
              >
                {place.description || "Нет описания. Нажмите Изменить."}
              </Text>
            )}
          </PinCard>

          {/* Action buttons */}
          <View style={styles.actions}>
            <PinButton
              title="Добавить воспоминание"
              onPress={handleAddMemory}
              fullWidth
            />
            <PinButton
              title="Предложить встречу здесь"
              onPress={handleCreateMeetingHere}
              variant="secondary"
              fullWidth
            />
          </View>

          {/* Timeline of memories */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>
              Воспоминания ({placeNotes.length})
            </Text>

            {placeNotes.length === 0 ? (
              <PinCard>
                <Text style={styles.placeholderText}>
                  Пока нет воспоминаний. Добавьте первое!
                </Text>
              </PinCard>
            ) : (
              <View style={styles.timeline}>
                {placeNotes.map((note: PlaceNote, index: number) => (
                  <View key={note.id} style={styles.timelineItem}>
                    {/* Timeline line */}
                    <View style={styles.timelineLine}>
                      <View
                        style={[
                          styles.timelineDot,
                          note.mood && {
                            backgroundColor: MOOD_CONFIG[note.mood].color,
                          },
                        ]}
                      />
                      {index < placeNotes.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                    {/* Card */}
                    <View style={styles.timelineCard}>
                      <MemoryCard note={note} />
                      <TouchableOpacity
                        style={styles.deleteNote}
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Text style={styles.deleteNoteText}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Delete */}
          <View style={styles.dangerZone}>
            <PinButton
              title="Удалить место"
              onPress={handleDeletePlace}
              variant="danger"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      <AddNoteModal
        visible={showAddNote}
        noteText={noteText}
        notePhotoUri={notePhotoUri}
        onChangeText={setNoteText}
        onPickPhoto={handlePickPhoto}
        onRemovePhoto={() => setNotePhotoUri(undefined)}
        onSave={handleSaveNote}
        onClose={handleCloseAddNote}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s16,
  },
  notFoundText: { ...Typography.title3, color: Colors.neutral[600] },

  // Hero
  heroContainer: {
    height: 260,
    position: "relative",
  },
  heroPhoto: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroContent: {
    position: "absolute",
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

  mapSnapshot: { height: 200, width: "100%" },
  content: { padding: Spacing.s16, gap: Spacing.s16 },

  // Header
  placeHeader: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.s8,
  },
  placeName: {
    ...Typography.title2,
    color: Colors.neutral[900],
    flex: 1,
    marginRight: Spacing.s8,
  },
  favoriteButton: { padding: Spacing.s4 },
  heartIcon: { fontSize: 24, color: Colors.neutral[300] },
  heartIconActive: { color: Colors.accent.primary },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visitText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },

  // Sections
  section: { marginBottom: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s8,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s8,
  },
  editButton: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: "600",
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.neutral[700],
    lineHeight: 24,
  },
  placeholderText: { color: Colors.neutral[400], fontStyle: "italic" },

  // Actions
  actions: {
    gap: Spacing.s8,
  },

  // Timeline
  notesSection: { gap: Spacing.s8 },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: Spacing.s12,
  },
  timelineLine: {
    alignItems: "center",
    width: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brand.primary,
    marginTop: Spacing.s4,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.s4,
  },
  timelineCard: {
    flex: 1,
    marginBottom: Spacing.s12,
  },
  deleteNote: {
    alignSelf: "flex-end",
    marginTop: Spacing.s4,
  },
  deleteNoteText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: "600",
  },

  dangerZone: { paddingTop: Spacing.s8, paddingBottom: Spacing.s32 },
});
