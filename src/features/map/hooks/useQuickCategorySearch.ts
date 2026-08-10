import { useCallback, useEffect, useRef, useState } from 'react';

import { Coordinates } from '../../../models/types';
import { MapboxSearchResult, searchMapboxPlaces } from '../../../services/mapboxSearch';
import { bboxContains } from '../../../shared/geo';
import { QUICK_SEARCH_CATEGORIES } from '../constants';

const CAMERA_SETTLE_DEBOUNCE_MS = 500;

type Bbox = [number, number, number, number];
type GetVisibleBbox = () => Promise<Bbox | undefined>;

// Drives the quick-filter chip row under the top search bar: picking a category (Restaurants,
// Parks, ...) runs a Mapbox category search scoped to whatever's currently on screen (Mapbox's
// own service limits make a user-adjustable radius pointless) and hands the results to the
// caller, which renders them the same way as a full-text search result.
//
// While a category stays selected, panning/zooming the map does NOT silently re-search —
// instead, once the viewport moves outside the bbox the last search covered, `canSearchHere`
// flips true so the map can show a "Search here" button (Google/Apple Maps style). Tapping it
// calls `searchHere`, which re-runs the same category against the new viewport.
export function useQuickCategorySearch(
  onResults: (results: MapboxSearchResult[]) => void,
  onClearResults: () => void,
  getVisibleBbox: GetVisibleBbox,
) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canSearchHere, setCanSearchHere] = useState(false);
  // Separate from `loading` (which also covers the initial pick-a-category search, shown as
  // a spinner on the chip itself) so the "Search here" button only spins for its own tap.
  const [searchHereLoading, setSearchHereLoading] = useState(false);
  // Read from the debounce timer's closure without making onCameraSettled's identity churn
  // on every category pick — mirrors useMapScreen's currentCenter/currentZoom ref pattern.
  const activeCategoryRef = useRef<string | null>(null);
  const lastSearchedBboxRef = useRef<Bbox | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (categoryKey: string, proximity: Coordinates) => {
      const category = QUICK_SEARCH_CATEGORIES.find((c) => c.key === categoryKey);
      if (!category) return;

      setLoading(true);
      setCanSearchHere(false);
      try {
        const bbox = await getVisibleBbox();
        lastSearchedBboxRef.current = bbox ?? null;
        const results = await searchMapboxPlaces(category.query, proximity, { bbox });
        onResults(results);
      } catch {
        onResults([]);
      } finally {
        setLoading(false);
      }
    },
    [onResults, getVisibleBbox],
  );

  const selectCategory = useCallback(
    (categoryKey: string, proximity: Coordinates) => {
      if (activeCategoryRef.current === categoryKey) {
        activeCategoryRef.current = null;
        lastSearchedBboxRef.current = null;
        setActiveCategory(null);
        setCanSearchHere(false);
        onClearResults();
        return;
      }
      activeCategoryRef.current = categoryKey;
      setActiveCategory(categoryKey);
      void runSearch(categoryKey, proximity);
    },
    [runSearch, onClearResults],
  );

  // Re-runs the active category against wherever the map is centered now — the "Search here"
  // button's only action.
  const searchHere = useCallback(
    (proximity: Coordinates) => {
      if (!activeCategoryRef.current) return;
      setSearchHereLoading(true);
      void runSearch(activeCategoryRef.current, proximity).finally(() =>
        setSearchHereLoading(false),
      );
    },
    [runSearch],
  );

  const clear = useCallback(() => {
    activeCategoryRef.current = null;
    lastSearchedBboxRef.current = null;
    setActiveCategory(null);
    setCanSearchHere(false);
  }, []);

  const checkBoundsForSearchHere = useCallback(async () => {
    if (!activeCategoryRef.current) return;
    const bbox = await getVisibleBbox();
    if (!bbox || !lastSearchedBboxRef.current) return;
    setCanSearchHere(!bboxContains(lastSearchedBboxRef.current, bbox));
  }, [getVisibleBbox]);

  const onCameraSettled = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => void checkBoundsForSearchHere(),
      CAMERA_SETTLE_DEBOUNCE_MS,
    );
  }, [checkBoundsForSearchHere]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    activeCategory,
    loading,
    canSearchHere,
    searchHereLoading,
    selectCategory,
    searchHere,
    onCameraSettled,
    clear,
  };
}
