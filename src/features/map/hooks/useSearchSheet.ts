import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates, Place, PlaceCategory } from '../../../models/types';
import { MapboxSearchResult, searchMapboxPlaces } from '../../../services/mapboxSearch';

export type SpecialFilter = 'mine' | 'favorites';

export const MIN_EXTERNAL_QUERY_LENGTH = 2;

const DEFAULT_RADIUS_M = 5000;
const MAX_RADIUS_M = 50000;

const METERS_PER_DEGREE_LAT = 111320;

const CATEGORY_SEARCH_KEYWORDS: Record<PlaceCategory, string> = {
  food: 'restaurant',
  coffee: 'coffee shop',
  nature: 'park',
  art: 'art gallery',
  sports: 'sports',
};

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function radiusToBbox(center: Coordinates, radiusM: number): [number, number, number, number] {
  const latDelta = radiusM / METERS_PER_DEGREE_LAT;
  const lonDelta =
    radiusM / (METERS_PER_DEGREE_LAT * Math.cos((center.latitude * Math.PI) / 180));
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
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [radiusEnabled, setRadiusEnabled] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<PlaceCategory>>(new Set());
  const [specialFilters, setSpecialFilters] = useState<Set<SpecialFilter>>(new Set());
  const [alwaysShowFavorites, setAlwaysShowFavorites] = useState(true);

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
    const categoryKeywords = Array.from(categories).map((cat) => CATEGORY_SEARCH_KEYWORDS[cat]);
    const effectiveQuery = [trimmed, ...categoryKeywords].filter(Boolean).join(' ').trim();
    if (!effectiveQuery) return;

    const bbox =
      radiusEnabled && userLocation && radiusM < MAX_RADIUS_M
        ? radiusToBbox(userLocation, radiusM)
        : undefined;

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
    if (query.trim().length < MIN_EXTERNAL_QUERY_LENGTH && activeCategories.size === 0) return;
    void runExternalSearch(activeCategories, query);
  }

  function toggleCategory(cat: PlaceCategory) {
    const next = new Set(activeCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setActiveCategories(next);
    void runExternalSearch(next, query);
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
        radiusEnabled &&
        userLocation &&
        radiusM < MAX_RADIUS_M &&
        haversineMeters(userLocation, place.coordinates) > radiusM
      )
        return false;
      return true;
    });
  }, [places, debouncedQuery, activeCategories, specialFilters, userLocation, radiusM, radiusEnabled]);

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
  };
}
