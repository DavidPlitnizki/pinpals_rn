import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates, Place } from '../../../models/types';
import { MapboxSearchResult, searchMapboxPlaces } from '../../../services/mapboxSearch';
import { useSearchFiltersStore } from '../../../store/useSearchFiltersStore';

export const MIN_EXTERNAL_QUERY_LENGTH = 2;

type GetVisibleBbox = () => Promise<[number, number, number, number] | undefined>;

export function useSearchSheet(
  places: Place[],
  getMapCenter: () => Coordinates,
  getVisibleBbox: GetVisibleBbox,
) {
  const [visible, setVisible] = useState(false);

  const query = useSearchFiltersStore((s) => s.query);
  const setQuery = useSearchFiltersStore((s) => s.setQuery);
  const resetPersistedFilters = useSearchFiltersStore((s) => s.resetFilters);

  const debouncedQuery = useDebouncedValue(query);

  const [externalResults, setExternalResults] = useState<MapboxSearchResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalSearched, setExternalSearched] = useState(false);

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  async function runExternalSearch(textQuery: string) {
    const trimmed = textQuery.trim();

    // Nothing left to search for (the text was cleared) — clear any stale results instead of
    // leaving the previous search's results on screen.
    if (trimmed.length < MIN_EXTERNAL_QUERY_LENGTH) {
      setExternalResults([]);
      setExternalSearched(false);
      return;
    }

    setExternalLoading(true);
    setExternalSearched(true);
    try {
      // Search where the map is currently showing, not the user's GPS position — and scope
      // results to whatever's actually visible on screen (Mapbox's own service limits make a
      // broader radius pointless).
      const bbox = await getVisibleBbox();
      const results = await searchMapboxPlaces(trimmed, getMapCenter(), { bbox });
      setExternalResults(results);
    } catch {
      setExternalResults([]);
    } finally {
      setExternalLoading(false);
    }
  }

  function searchExternal() {
    void runExternalSearch(query);
  }

  function resetFilters() {
    resetPersistedFilters();
    setExternalResults([]);
    setExternalSearched(false);
  }

  const filteredPlaces = useMemo(() => {
    if (!debouncedQuery.trim()) return places;
    const needle = debouncedQuery.toLowerCase();
    return places.filter((place) => place.name.toLowerCase().includes(needle));
  }, [places, debouncedQuery]);

  return {
    visible,
    query,
    setQuery,
    filteredPlaces,
    externalResults,
    externalLoading,
    externalSearched,
    searchExternal,
    open,
    close,
    resetFilters,
  };
}
