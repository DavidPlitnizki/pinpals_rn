import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { PlaceCategory } from "../../../models/types";
import { useAppStore } from "../../../store/useAppStore";

export function useExploreScreen() {
  const router = useRouter();
  const { places } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | "all">("all");

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [places, searchQuery, selectedCategory]);

  function handlePlacePress(id: string) {
    router.push({ pathname: "/place/[id]", params: { id } } as any);
  }

  return {
    places,
    filteredPlaces,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    handlePlacePress,
  };
}
