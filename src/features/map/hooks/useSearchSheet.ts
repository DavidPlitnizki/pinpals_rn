import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates, Place, PlaceCategory } from '../../../models/types';

export type SpecialFilter = 'mine' | 'favorites';

const DEFAULT_RADIUS_M = 50000;
const MAX_RADIUS_M = 50000;

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

export function formatRadius(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function useSearchSheet(places: Place[], userLocation: Coordinates | null) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [activeCategories, setActiveCategories] = useState<Set<PlaceCategory>>(new Set());
  const [specialFilters, setSpecialFilters] = useState<Set<SpecialFilter>>(new Set());

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
      if (debouncedQuery.trim() && !place.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        return false;
      if (activeCategories.size > 0 && !activeCategories.has(place.category)) return false;
      if (specialFilters.has('favorites') && !place.isFavorite) return false;
      if (
        userLocation &&
        radiusM < MAX_RADIUS_M &&
        haversineMeters(userLocation, place.coordinates) > radiusM
      )
        return false;
      return true;
    });
  }, [places, debouncedQuery, activeCategories, specialFilters, userLocation, radiusM]);

  return {
    visible,
    query,
    setQuery,
    radiusM,
    setRadiusM,
    maxRadiusM: MAX_RADIUS_M,
    activeCategories,
    specialFilters,
    filteredPlaces,
    open,
    close,
    toggleCategory,
    toggleSpecial,
  };
}
