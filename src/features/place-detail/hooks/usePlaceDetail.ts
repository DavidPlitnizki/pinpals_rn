import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { usePlacesStore } from "../../../store/usePlacesStore";

export function usePlaceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, notes, updatePlace, deletePlace, toggleFavorite, addNote, deleteNote } =
    usePlacesStore();

  const place = places.find((p) => p.id === id);
  const placeNotes = notes.filter((n) => n.placeId === id);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(place?.description ?? "");
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notePhotoUri, setNotePhotoUri] = useState<string | undefined>();

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
      "Delete Place",
      `Are you sure you want to delete "${place!.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePlace(place!.id);
            router.back();
          },
        },
      ],
    );
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
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
      Alert.alert("Note required", "Please enter some text for your note.");
      return;
    }
    addNote({
      placeId: place!.id,
      text: noteText.trim(),
      photoUri: notePhotoUri,
    });
    setNoteText("");
    setNotePhotoUri(undefined);
    setShowAddNote(false);
  }

  function handleDeleteNote(noteId: string) {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(noteId) },
    ]);
  }

  function handleCloseAddNote() {
    setShowAddNote(false);
    setNoteText("");
    setNotePhotoUri(undefined);
  }

  return {
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
  };
}
