import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { MemoryMood } from '../../../models/types';
import { copyPhotosToAppStorage } from '../../../shared/photoStorage';
import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { usePlacesStore } from '../../../store/usePlacesStore';

export function useCreateMemory() {
  const router = useRouter();
  // `noteId` present = editing an existing memory; the wizard is otherwise identical, it
  // just starts pre-filled and saves over the note instead of appending a new one.
  const { placeId, noteId } = useLocalSearchParams<{ placeId: string; noteId?: string }>();
  const { addNote, updateNote, notes, places } = usePlacesStore();

  const place = places.find((p) => p.id === placeId);
  const [editedNote] = useState(() => (noteId ? notes.find((n) => n.id === noteId) : undefined));
  const isEditing = !!editedNote;

  // Steps: 0=photos, 1=mood, 2=companions, 3=note, 4=date
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const [photoUris, setPhotoUris] = useState<string[]>(
    () => editedNote?.photoUris ?? (editedNote?.photoUri ? [editedNote.photoUri] : []),
  );
  const [mood, setMood] = useState<MemoryMood | undefined>(editedNote?.mood);
  const [companions, setCompanions] = useState<string[]>(editedNote?.companions ?? []);
  const [text, setText] = useState(editedNote?.text ?? '');
  // A brand new memory defaults to right now — date and time both.
  const [date, setDate] = useState(() =>
    editedNote ? new Date(editedNote.createdAt) : new Date(),
  );

  function nextStep() {
    if (step < totalSteps - 1) setStep(step + 1);
  }

  // Jumps past every remaining step to the last one, where the memory gets saved — the whole
  // point of the header arrow, as opposed to the Next button that walks one screen at a time.
  // It stops at the last step rather than saving outright: the date is worth a glance before
  // committing, and saving from a header chevron would be a destructive-feeling surprise.
  function skipToEnd() {
    setStep(totalSteps - 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
    else router.back();
  }

  async function pickPhotos() {
    const remaining = 5 - photoUris.length;
    if (remaining <= 0) return;

    const source = await promptPhotoSource();
    if (!source) return;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to the camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUris((prev) => [...prev, result.assets[0].uri].slice(0, 5));
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...newUris].slice(0, 5));
    }
  }

  function removePhoto(uri: string) {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }

  function addCompanion(name: string) {
    if (!companions.includes(name)) {
      setCompanions([...companions, name]);
    }
  }

  function removeCompanion(name: string) {
    setCompanions(companions.filter((c) => c !== name));
  }

  async function handleSave() {
    if (!placeId) {
      Alert.alert('Error', 'No place selected.');
      return;
    }

    // Photos already living in app storage (an edited note's existing ones) are passed
    // through untouched; only newly picked picker temp paths get copied.
    const copiedPhotoUris = await copyPhotosToAppStorage(photoUris);

    if (editedNote) {
      updateNote(editedNote.id, {
        text: text.trim(),
        photoUri: copiedPhotoUris[0],
        photoUris: copiedPhotoUris.length > 0 ? copiedPhotoUris : undefined,
        mood,
        companions,
        createdAt: date.toISOString(),
      });
      router.back();
      return;
    }

    addNote({
      placeId,
      text: text.trim(),
      photoUri: copiedPhotoUris[0],
      photoUris: copiedPhotoUris.length > 0 ? copiedPhotoUris : undefined,
      mood,
      companions,
      colorTag: mood ? undefined : undefined,
      createdAt: date.toISOString(),
    });

    router.back();
  }

  // Every step is optional — a memory is worth saving even as just a date and a place, and
  // anything skipped here can still be filled in later by editing it.
  const canGoNext = true;

  const isLastStep = step === totalSteps - 1;

  return {
    place,
    isEditing,
    step,
    totalSteps,
    photoUris,
    mood,
    companions,
    text,
    date,
    canGoNext,
    isLastStep,
    nextStep,
    skipToEnd,
    prevStep,
    pickPhotos,
    removePhoto,
    setMood,
    addCompanion,
    removeCompanion,
    setText,
    setDate,
    handleSave,
  };
}
