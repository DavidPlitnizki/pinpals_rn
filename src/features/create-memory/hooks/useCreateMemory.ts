import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { MemoryMood } from "../../../models/types";
import { usePlacesStore } from "../../../store/usePlacesStore";

export function useCreateMemory() {
  const router = useRouter();
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { addNote, places } = usePlacesStore();

  const place = places.find((p) => p.id === placeId);

  // Steps: 0=photos, 1=mood, 2=companions, 3=note, 4=date
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [mood, setMood] = useState<MemoryMood | undefined>(undefined);
  const [companions, setCompanions] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date());

  function nextStep() {
    if (step < totalSteps - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
    else router.back();
  }

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photoUris.length,
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

  function handleSave() {
    if (!placeId) {
      Alert.alert("Error", "No place selected.");
      return;
    }

    addNote({
      placeId,
      text: text.trim(),
      photoUri: photoUris[0],
      photoUris: photoUris.length > 0 ? photoUris : undefined,
      mood,
      companions,
      colorTag: mood ? undefined : undefined,
      createdAt: date.toISOString(),
    });

    router.back();
  }

  const canGoNext = (() => {
    switch (step) {
      case 0: return true; // photos optional
      case 1: return !!mood; // mood required
      case 2: return true; // companions optional
      case 3: return true; // text optional
      case 4: return true; // date always valid
      default: return true;
    }
  })();

  const isLastStep = step === totalSteps - 1;

  return {
    place,
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
