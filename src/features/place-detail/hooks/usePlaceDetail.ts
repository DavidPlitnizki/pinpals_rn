import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

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

  function handleSaveDescription() {
    updatePlace(place!.id, { description: description.trim() || undefined });
    setIsEditingDescription(false);
  }

  function handleToggleFavorite() {
    toggleFavorite(place!.id);
  }

  function handleDeletePlace() {
    Alert.alert('Удалить место', `Удалить "${place!.name}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          deletePlace(place!.id);
          router.back();
        },
      },
    ]);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нужно разрешение', 'Разрешите доступ к галерее.');
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

  function handleSaveNote() {
    if (!noteText.trim()) {
      Alert.alert('Текст обязателен', 'Введите текст заметки.');
      return;
    }
    addNote({
      placeId: place!.id,
      text: noteText.trim(),
      photoUri: notePhotoUri,
      companions: [],
    });
    setNoteText('');
    setNotePhotoUri(undefined);
    setShowAddNote(false);
  }

  function handleDeleteNote(noteId: string) {
    Alert.alert('Удалить заметку', 'Удалить это воспоминание?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteNote(noteId) },
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
  };
}
