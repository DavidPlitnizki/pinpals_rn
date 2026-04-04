import { useMemo, useState } from "react";

import { Place, PlaceCategory } from "../../../models/types";

export type SpecialFilter = "mine" | "favorites";

export function useSearchSheet(places: Place[]) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<PlaceCategory>>(
    new Set(),
  );
  const [specialFilters, setSpecialFilters] = useState<Set<SpecialFilter>>(
    new Set(),
  );

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function toggleCategory(cat: PlaceCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleSpecial(filter: SpecialFilter) {
    setSpecialFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (
        query.trim() &&
        !place.name.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      if (
        activeCategories.size > 0 &&
        !activeCategories.has(place.category)
      )
        return false;
      if (specialFilters.has("favorites") && !place.isFavorite) return false;
      return true;
    });
  }, [places, query, activeCategories, specialFilters]);

  return {
    visible,
    query,
    setQuery,
    activeCategories,
    specialFilters,
    filteredPlaces,
    open,
    close,
    toggleCategory,
    toggleSpecial,
  };
}
