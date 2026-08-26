import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates, Place } from '../../../models/types';
import {
  MapboxSearchResult,
  MapboxSuggestion,
  retrieveMapboxPlace,
  suggestMapboxPlaces,
} from '../../../services/mapboxSearch';
import { logMapboxUsage } from '../../../services/analytics';
import { useSearchFiltersStore } from '../../../store/useSearchFiltersStore';

export const MIN_EXTERNAL_QUERY_LENGTH = 2;

// Stable empty reference so a too-short query doesn't hand the sheet a new array each render.
const EMPTY_SUGGESTIONS: MapboxSuggestion[] = [];

export function useSearchSheet(places: Place[], getMapCenter: () => Coordinates) {
  const [visible, setVisible] = useState(false);

  const query = useSearchFiltersStore((s) => s.query);
  const setQuery = useSearchFiltersStore((s) => s.setQuery);
  const resetPersistedFilters = useSearchFiltersStore((s) => s.resetFilters);

  const debouncedQuery = useDebouncedValue(query);

  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [retrievingId, setRetrievingId] = useState<string | null>(null);

  // One Mapbox session spans every keystroke of a single search and ends at the retrieve that
  // resolves it — that pairing is what makes the whole search one billable unit instead of one
  // per keystroke. Regenerated after each retrieve, and whenever the sheet is opened afresh.
  const sessionTokenRef = useRef(Crypto.randomUUID());
  // Cancels the request already in flight when the next keystroke lands, so a slow early
  // response can't overwrite the results for what's currently typed.
  const abortRef = useRef<AbortController | null>(null);
  // Mapbox bills the session, not the keystrokes — so this counts the first suggest of each
  // session and ignores the rest. Sessions abandoned without a retrieve are billed too, which
  // is why it's counted here and not at retrieve.
  const sessionCountedRef = useRef(false);

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  const resetFilters = useCallback(() => {
    resetPersistedFilters();
    setSuggestions([]);
    setSearched(false);
  }, [resetPersistedFilters]);

  // Below the minimum length there is nothing to ask Mapbox for. Handled by deriving what the
  // sheet shows rather than by clearing state from the effect: the stored suggestions are
  // simply not displayed, which keeps the effect free of synchronous setState and avoids a
  // render pass whose only job is to blank a list.
  const queryTooShort = debouncedQuery.trim().length < MIN_EXTERNAL_QUERY_LENGTH;

  // Suggestions follow the typing rather than a Search button, so the effect is the whole
  // mechanism here, not a shortcut around a user action.
  useEffect(() => {
    if (queryTooShort) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    void (async () => {
      setLoading(true);
      if (!sessionCountedRef.current) {
        sessionCountedRef.current = true;
        logMapboxUsage('search_session');
      }
      try {
        // Proximity only, deliberately no bbox: Mapbox treats bbox as a hard filter, so
        // scoping typed search to the visible map meant you could only ever find what was
        // already on screen. Searching for somewhere in another country — the usual reason
        // to type its name rather than tap it — returned whatever happened to match inside
        // the current view instead. Proximity biases towards where you're looking without
        // excluding anywhere else. The category chips still pass bbox: "restaurants" is a
        // question about the visible area, and there filtering is the point.
        const results = await suggestMapboxPlaces(
          debouncedQuery.trim(),
          getMapCenter(),
          sessionTokenRef.current,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setSearched(true);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery, queryTooShort, getMapCenter]);

  // A suggestion is only an id and some text — this is where it becomes a real place.
  const selectSuggestion = useCallback(
    async (suggestion: MapboxSuggestion): Promise<MapboxSearchResult | null> => {
      setRetrievingId(suggestion.mapboxId);
      try {
        return await retrieveMapboxPlace(suggestion.mapboxId, sessionTokenRef.current);
      } catch {
        return null;
      } finally {
        setRetrievingId(null);
        // The session ends with the retrieve it paid for; the next query starts a new one.
        sessionTokenRef.current = Crypto.randomUUID();
        sessionCountedRef.current = false;
      }
    },
    [],
  );

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
    suggestions: queryTooShort ? EMPTY_SUGGESTIONS : suggestions,
    externalLoading: !queryTooShort && loading,
    externalSearched: !queryTooShort && searched,
    retrievingId,
    selectSuggestion,
    open,
    close,
    resetFilters,
  };
}
