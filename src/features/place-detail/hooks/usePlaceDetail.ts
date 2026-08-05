import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { copyPhotoToAppStorage } from '../../../shared/photoStorage';
import { usePlacesStore } from '../../../store/usePlacesStore';

export function usePlaceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    places,
    notes,
    updatePlace,
    deletePlace,
    toggleFavorite,
    addNote,
    deleteNote,
    deleteNotePhoto,
    addTagToPlace,
    removeTagFromPlace,
    getLatestMoodForPlace,
  } = usePlacesStore();

  const place = places.find((p) => p.id === id);
  const placeNotes = notes
    .filter((n) => n.placeId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const latestMood = id ? getLatestMoodForPlace(id) : undefined;

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(place?.description ?? '');
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notePhotoUri, setNotePhotoUri] = useState<string | undefined>();
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  function handleSaveDescription() {
    updatePlace(place!.id, { description: description.trim() || undefined });
    setIsEditingDescription(false);
  }

  function handleToggleFavorite() {
    toggleFavorite(place!.id);
  }

  function handleSetPinColor(color: string | undefined) {
    updatePlace(place!.id, { pinColor: color });
  }

  function handleDeletePlace() {
    Alert.alert('Delete place', `Delete "${place!.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlace(place!.id);
          router.back();
        },
      },
    ]);
  }

  async function handlePickPhoto() {
    const source = await promptPhotoSource();
    if (!source) return;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to the camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setNotePhotoUri(result.assets[0].uri);
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to the photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNotePhotoUri(result.assets[0].uri);
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim()) {
      Alert.alert('Text required', 'Please enter the note text.');
      return;
    }
    const photoUri = notePhotoUri ? await copyPhotoToAppStorage(notePhotoUri) : undefined;
    addNote({
      placeId: place!.id,
      text: noteText.trim(),
      photoUri,
      companions: [],
    });
    setNoteText('');
    setNotePhotoUri(undefined);
    setShowAddNote(false);
  }

  function handleOpenPhotoViewer(photoUris: string[], index: number) {
    setViewerPhotos(photoUris);
    setViewerIndex(index);
    setViewerVisible(true);
  }

  function handleClosePhotoViewer() {
    setViewerVisible(false);
  }

  function handleDeleteNote(noteId: string) {
    Alert.alert('Delete note', 'Delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(noteId) },
    ]);
  }

  function handleCloseAddNote() {
    setShowAddNote(false);
    setNoteText('');
    setNotePhotoUri(undefined);
  }

  function handleAddMemory() {
    router.push({ pathname: '/create-memory', params: { placeId: place!.id } } as any);
  }

  function handleCreateMeetingHere() {
    router.push({ pathname: '/create-meeting', params: { placeId: place!.id } } as any);
  }

  function handleAddTag(tag: string) {
    if (place) addTagToPlace(place.id, tag);
  }

  function handleRemoveTag(tag: string) {
    if (place) removeTagFromPlace(place.id, tag);
  }

  return {
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
    viewerPhotos,
    viewerIndex,
    viewerVisible,
    handleOpenPhotoViewer,
    handleClosePhotoViewer,
    deleteNotePhoto,
    handleSaveDescription,
    handleToggleFavorite,
    handleSetPinColor,
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
  };
}
