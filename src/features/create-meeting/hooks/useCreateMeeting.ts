import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { MapPressEvent } from "react-native-maps";

import { Coordinates } from "../../../models/types";
import { useAppStore } from "../../../store/useAppStore";
import { DEFAULT_COORDS } from "../constants";

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function useCreateMeeting() {
  const router = useRouter();
  const { addMeeting } = useAppStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTomorrow());
  const [showDateModal, setShowDateModal] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_COORDS);

  const tomorrow = getTomorrow();
  const [tempDay, setTempDay] = useState(tomorrow.getDate());
  const [tempMonth, setTempMonth] = useState(tomorrow.getMonth());
  const [tempYear, setTempYear] = useState(tomorrow.getFullYear());
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);

  function handleMapPress(event: MapPressEvent) {
    setCoordinates(event.nativeEvent.coordinate);
  }

  function openDateModal() {
    setTempDay(date.getDate());
    setTempMonth(date.getMonth());
    setTempYear(date.getFullYear());
    setTempHour(date.getHours());
    setTempMinute(date.getMinutes());
    setShowDateModal(true);
  }

  function confirmDate() {
    setDate(new Date(tempYear, tempMonth, tempDay, tempHour, tempMinute));
    setShowDateModal(false);
  }

  function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a title for the meeting.");
      return;
    }
    addMeeting({
      title: title.trim(),
      description: description.trim() || undefined,
      coordinates,
      date: date.toISOString(),
    });
    router.back();
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    date,
    coordinates,
    showDateModal,
    setShowDateModal,
    tempDay,
    setTempDay,
    tempMonth,
    setTempMonth,
    tempYear,
    setTempYear,
    tempHour,
    setTempHour,
    tempMinute,
    setTempMinute,
    handleMapPress,
    openDateModal,
    confirmDate,
    getDaysInMonth,
    handleSave,
  };
}
