import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { useAppStore } from "../../../store/useAppStore";
import { Tab } from "../types";

export function useMyPlacesScreen() {
  const router = useRouter();
  const { places, meetings, deletePlace } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const displayedPlaces =
    activeTab === "favorites" ? places.filter((p) => p.isFavorite) : places;

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function handlePlacePress(id: string) {
    router.push({ pathname: "/place/[id]", params: { id } } as any);
  }

  function handleDeletePlace(id: string, name: string) {
    Alert.alert("Delete Place", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePlace(id) },
    ]);
  }

  return {
    places,
    displayedPlaces,
    upcomingMeetings,
    activeTab,
    setActiveTab,
    handlePlacePress,
    handleDeletePlace,
  };
}
