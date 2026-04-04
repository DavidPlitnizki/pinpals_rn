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
import { PinRatingView } from "../../design-system/components/PinRatingView";
import { PinTextField } from "../../design-system/components/PinTextField";
import { Colors, Radii, Spacing, Typography } from "../../design-system/tokens";
import { PlaceNote } from "../../models/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../shared/constants";
import { AddNoteModal } from "./components/AddNoteModal";
import { usePlaceDetail } from "./hooks/usePlaceDetail";

export default function PlaceDetailScreen() {
  const {
    place,
    placeNotes,
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
    handleRatingChange,
    handleSaveDescription,
    handleToggleFavorite,
    handleDeletePlace,
    handlePickPhoto,
    handleSaveNote,
    handleDeleteNote,
    handleCloseAddNote,
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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
                backgroundColor: CATEGORY_COLORS[place.category],
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          </PointAnnotation>
        </MapView>

        <View style={styles.content}>
          {/* Header */}
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
              <Text style={styles.dateText}>
                Added {new Date(place.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Rating</Text>
              <PinRatingView
                rating={place.rating}
                onRatingChange={handleRatingChange}
                size={24}
              />
            </View>
          </View>

          {/* Description */}
          <PinCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
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
                  {isEditingDescription ? "Save" : "Edit"}
                </Text>
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
              <Text
                style={[
                  styles.descriptionText,
                  !place.description && styles.placeholderText,
                ]}
              >
                {place.description || "No description yet. Tap Edit to add one."}
              </Text>
            )}
          </PinCard>

          {/* Notes */}
          <View style={styles.notesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Notes ({placeNotes.length})
              </Text>
              <TouchableOpacity onPress={() => setShowAddNote(true)}>
                <Text style={styles.editButton}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {placeNotes.length === 0 ? (
              <PinCard>
                <Text style={styles.placeholderText}>
                  No notes yet. Add your memories and photos.
                </Text>
              </PinCard>
            ) : (
              placeNotes.map((note: PlaceNote) => (
                <PinCard key={note.id} style={styles.noteCard}>
                  {note.photoUri ? (
                    <Image
                      source={{ uri: note.photoUri }}
                      style={styles.notePhoto}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={styles.noteText}>{note.text}</Text>
                  <View style={styles.noteFooter}>
                    <Text style={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                      <Text style={styles.deleteNoteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </PinCard>
              ))
            )}
          </View>

          {/* Delete */}
          <View style={styles.dangerZone}>
            <PinButton
              title="Delete Place"
              onPress={handleDeletePlace}
              variant="secondary"
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
  mapSnapshot: { height: 200, width: "100%" },
  content: { padding: Spacing.s16, gap: Spacing.s16 },
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
    marginBottom: Spacing.s12,
  },
  dateText: { ...Typography.caption, color: Colors.neutral[400] },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.s12 },
  ratingLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: "600",
  },
  section: { marginBottom: 0 },
  notesSection: { gap: Spacing.s8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s8,
  },
  sectionTitle: { ...Typography.title3, color: Colors.neutral[900] },
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
  noteCard: { marginBottom: 0 },
  notePhoto: {
    width: "100%",
    height: 160,
    borderRadius: Radii.sm,
    marginBottom: Spacing.s8,
  },
  noteText: {
    ...Typography.body,
    color: Colors.neutral[800],
    marginBottom: Spacing.s8,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDate: { ...Typography.caption, color: Colors.neutral[400] },
  deleteNoteText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: "600",
  },
  dangerZone: { paddingTop: Spacing.s8, paddingBottom: Spacing.s32 },
});
