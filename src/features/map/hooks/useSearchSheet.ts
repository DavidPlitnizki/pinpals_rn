import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates, Place, PlaceCategory } from '../../../models/types';
import { MapboxSearchResult, searchMapboxPlaces } from '../../../services/mapboxSearch';
import { haversineMeters } from '../../../shared/geo';
import { useSearchFiltersStore } from '../../../store/useSearchFiltersStore';
import { DEFAULT_RADIUS_M, MAX_RADIUS_M } from '../constants';
import { SpecialFilter } from '../types';

export type { SpecialFilter };

export const MIN_EXTERNAL_QUERY_LENGTH = 2;

const METERS_PER_DEGREE_LAT = 111320;

const CATEGORY_SEARCH_KEYWORDS: Record<PlaceCategory, string> = {
  food: 'restaurant',
  coffee: 'coffee shop',
  nature: 'park',
  art: 'art gallery',
  sports: 'sports',
};

function radiusToBbox(center: Coordinates, radiusM: number): [number, number, number, number] {
  const latDelta = radiusM / METERS_PER_DEGREE_LAT;
  const lonDelta = radiusM / (METERS_PER_DEGREE_LAT * Math.cos((center.latitude * Math.PI) / 180));
  return [
    center.longitude - lonDelta,
    center.latitude - latDelta,
    center.longitude + lonDelta,
    center.latitude + latDelta,
  ];
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

  const query = useSearchFiltersStore((s) => s.query);
  const setQuery = useSearchFiltersStore((s) => s.setQuery);
  const radiusM = useSearchFiltersStore((s) => s.radiusM);
  const setRadiusM = useSearchFiltersStore((s) => s.setRadiusM);
  const radiusEnabled = useSearchFiltersStore((s) => s.radiusEnabled);
  const setRadiusEnabled = useSearchFiltersStore((s) => s.setRadiusEnabled);
  const activeCategoriesList = useSearchFiltersStore((s) => s.activeCategories);
  const setActiveCategoriesList = useSearchFiltersStore((s) => s.setActiveCategories);
  const specialFiltersList = useSearchFiltersStore((s) => s.specialFilters);
  const setSpecialFiltersList = useSearchFiltersStore((s) => s.setSpecialFilters);
  const alwaysShowFavorites = useSearchFiltersStore((s) => s.alwaysShowFavorites);
  const setAlwaysShowFavorites = useSearchFiltersStore((s) => s.setAlwaysShowFavorites);
  const resetPersistedFilters = useSearchFiltersStore((s) => s.resetFilters);

  const activeCategories = useMemo(() => new Set(activeCategoriesList), [activeCategoriesList]);
  const specialFilters = useMemo(() => new Set(specialFiltersList), [specialFiltersList]);

  const debouncedQuery = useDebouncedValue(query);

  const [externalResults, setExternalResults] = useState<MapboxSearchResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalSearched, setExternalSearched] = useState(false);

  const showExternal = !specialFilters.has('mine');

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  async function runExternalSearch(categories: Set<PlaceCategory>, textQuery: string) {
    if (specialFilters.has('mine')) return;
    const trimmed = textQuery.trim();
    // Category chips are single-select (see toggleCategory), so this is 0 or 1 category —
    // never a set that needs its own OR handling or multiple requests.
    const category = categories.size > 0 ? Array.from(categories)[0] : undefined;

    // Nothing left to search for (the chip just got unselected, or the text was cleared) —
    // clear any stale results instead of leaving the previous search's results on screen.
    if (!category && trimmed.length < MIN_EXTERNAL_QUERY_LENGTH) {
      setExternalResults([]);
      setExternalSearched(false);
      return;
    }

    const bbox =
      radiusEnabled && userLocation && radiusM < MAX_RADIUS_M
        ? radiusToBbox(userLocation, radiusM)
        : undefined;

    const effectiveQuery = [trimmed, category ? CATEGORY_SEARCH_KEYWORDS[category] : undefined]
      .filter(Boolean)
      .join(' ')
      .trim();

    setExternalLoading(true);
    setExternalSearched(true);
    try {
      const results = await searchMapboxPlaces(effectiveQuery, userLocation, { bbox });
      setExternalResults(results);
    } catch {
      setExternalResults([]);
    } finally {
      setExternalLoading(false);
    }
  }

  function searchExternal() {
    void runExternalSearch(activeCategories, query);
  }

  // Category chips are single-select: picking one deselects any other, tapping the active
  // one clears it. "Mine only" / "Want to visit" (toggleSpecial) stay independent multi-
  // select — they read from local storage and render in a separate results column, so they
  // never compete for the same external-search query the way category keywords did.
  function toggleCategory(cat: PlaceCategory) {
    setActiveCategoriesList(activeCategories.has(cat) ? [] : [cat]);
  }

  function toggleSpecial(filter: SpecialFilter) {
    const next = new Set(specialFilters);
    if (next.has(filter)) next.delete(filter);
    else next.add(filter);
    setSpecialFiltersList(Array.from(next));
  }

  function resetFilters() {
    resetPersistedFilters();
    setExternalResults([]);
    setExternalSearched(false);
  }

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (debouncedQuery.trim() && !place.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        return false;
      if (activeCategories.size > 0 && !activeCategories.has(place.category)) return false;
      if (specialFilters.has('favorites') && !place.isFavorite) return false;
      if (
        radiusEnabled &&
        userLocation &&
        radiusM < MAX_RADIUS_M &&
        haversineMeters(userLocation, place.coordinates) > radiusM
      )
        return false;
      return true;
    });
  }, [
    places,
    debouncedQuery,
    activeCategories,
    specialFilters,
    userLocation,
    radiusM,
    radiusEnabled,
  ]);

  const hasActiveFilters =
    debouncedQuery.trim().length > 0 ||
    activeCategories.size > 0 ||
    specialFilters.has('favorites') ||
    radiusM !== DEFAULT_RADIUS_M ||
    !radiusEnabled;

  const mapPlaces = useMemo(() => {
    if (!hasActiveFilters) return places;
    if (!alwaysShowFavorites) return filteredPlaces;
    const visibleIds = new Set(filteredPlaces.map((p) => p.id));
    const bypassedFavorites = places.filter((p) => p.isFavorite && !visibleIds.has(p.id));
    return [...filteredPlaces, ...bypassedFavorites];
  }, [places, filteredPlaces, hasActiveFilters, alwaysShowFavorites]);

  return {
    visible,
    query,
    setQuery,
    radiusM,
    setRadiusM,
    radiusEnabled,
    setRadiusEnabled,
    maxRadiusM: MAX_RADIUS_M,
    activeCategories,
    specialFilters,
    alwaysShowFavorites,
    setAlwaysShowFavorites,
    filteredPlaces,
    mapPlaces,
    showExternal,
    externalResults,
    externalLoading,
    externalSearched,
    searchExternal,
    open,
    close,
    toggleCategory,
    toggleSpecial,
    resetFilters,
  };
}
