import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinButton } from '../../design-system/components/PinButton';
import { PinCard } from '../../design-system/components/PinCard';
import { PinChip } from '../../design-system/components/PinChip';
import { PinRatingView } from '../../design-system/components/PinRatingView';
import { PinTextField } from '../../design-system/components/PinTextField';
import { PlaceCategory, PlaceNote } from '../../models/types';

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: '#E8834A',
  coffee: '#8B6347',
  nature: '#4A7C59',
  art: '#9C6ADE',
  sports: '#3D9BE9',
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, notes, updatePlace, deletePlace, toggleFavorite, addNote, deleteNote } =
    useAppStore();

  const place = places.find((p) => p.id === id);
  const placeNotes = notes.filter((n) => n.placeId === id);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(place?.description ?? '');
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePhotoUri, setNotePhotoUri] = useState<string | undefined>();

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

  function handleRatingChange(rating: number) {
    updatePlace(place!.id, { rating });
  }

  function handleSaveDescription() {
    updatePlace(place!.id, { description: description.trim() || undefined });
    setIsEditingDescription(false);
  }

  function handleToggleFavorite() {
    toggleFavorite(place!.id);
  }

  function handleDeletePlace() {
    Alert.alert(
      'Delete Place',
      `Are you sure you want to delete "${place!.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlace(place!.id);
            router.back();
          },
        },
      ]
    );
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNotePhotoUri(result.assets[0].uri);
    }
  }

  function handleSaveNote() {
    if (!noteText.trim()) {
      Alert.alert('Note required', 'Please enter some text for your note.');
      return;
    }
    addNote({
      placeId: place!.id,
      text: noteText.trim(),
      photoUri: notePhotoUri,
    });
    setNoteText('');
    setNotePhotoUri(undefined);
    setShowAddNote(false);
  }

  function handleDeleteNote(noteId: string) {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(noteId) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Snapshot */}
        <MapView
          style={styles.mapSnapshot}
          region={{
            latitude: place.coordinates.latitude,
            longitude: place.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={place.coordinates}
            pinColor={CATEGORY_COLORS[place.category]}
          />
        </MapView>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.placeHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.placeName}>{place.name}</Text>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Text style={[styles.heartIcon, place.isFavorite && styles.heartIconActive]}>
                  {place.isFavorite ? '♥' : '♡'}
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
              <TouchableOpacity onPress={() => {
                if (isEditingDescription) {
                  handleSaveDescription();
                } else {
                  setIsEditingDescription(true);
                }
              }}>
                <Text style={styles.editButton}>
                  {isEditingDescription ? 'Save' : 'Edit'}
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
              <Text style={[styles.descriptionText, !place.description && styles.placeholderText]}>
                {place.description || 'No description yet. Tap Edit to add one.'}
              </Text>
            )}
          </PinCard>

          {/* Notes */}
          <View style={styles.notesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notes ({placeNotes.length})</Text>
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
              placeNotes.map((note) => (
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

          {/* Delete Place */}
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

      {/* Add Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddNote(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => {
              setShowAddNote(false);
              setNoteText('');
              setNotePhotoUri(undefined);
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <PinTextField
              label="Note"
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your memory..."
              multiline
            />

            <View style={styles.photoSection}>
              {notePhotoUri ? (
                <View>
                  <Image
                    source={{ uri: notePhotoUri }}
                    style={styles.previewPhoto}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setNotePhotoUri(undefined)}
                  >
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <PinButton
                  title="Add Photo"
                  onPress={handlePickPhoto}
                  variant="secondary"
                  fullWidth
                />
              )}
            </View>

            <PinButton
              title="Save Note"
              onPress={handleSaveNote}
              fullWidth
              size="lg"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s16,
  },
  notFoundText: {
    ...Typography.title3,
    color: Colors.neutral[600],
  },
  mapSnapshot: {
    height: 200,
    width: '100%',
  },
  content: {
    padding: Spacing.s16,
    gap: Spacing.s16,
  },
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s8,
  },
  placeName: {
    ...Typography.title2,
    color: Colors.neutral[900],
    flex: 1,
    marginRight: Spacing.s8,
  },
  favoriteButton: {
    padding: Spacing.s4,
  },
  heartIcon: {
    fontSize: 24,
    color: Colors.neutral[300],
  },
  heartIconActive: {
    color: Colors.accent.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s12,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  ratingLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  section: {
    marginBottom: 0,
  },
  notesSection: {
    gap: Spacing.s8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s8,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
  },
  editButton: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.neutral[700],
    lineHeight: 24,
  },
  placeholderText: {
    color: Colors.neutral[400],
    fontStyle: 'italic',
  },
  noteCard: {
    marginBottom: 0,
  },
  notePhoto: {
    width: '100%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  deleteNoteText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  dangerZone: {
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s32,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
  },
  cancelText: {
    ...Typography.body,
    color: Colors.brand.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.s20,
  },
  photoSection: {
    marginVertical: Spacing.s16,
  },
  previewPhoto: {
    width: '100%',
    height: 200,
    borderRadius: Radii.md,
    marginBottom: Spacing.s8,
  },
  removePhotoButton: {
    alignItems: 'center',
    marginBottom: Spacing.s8,
  },
  removePhotoText: {
    ...Typography.subheadline,
    color: Colors.error,
  },
});
