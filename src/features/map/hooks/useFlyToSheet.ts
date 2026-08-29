import { useCallback, useRef, useState } from 'react';

import { Coordinates } from '../../../models/types';
import { MapboxSearchResult, searchMapboxPlaces } from '../../../services/mapboxSearch';

export function useFlyToSheet(onConfirm: (coordinates: Coordinates, label: string) => void) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MapboxSearchResult[]>([]);
  // Aborted on close so a slow request that outlives the sheet can't land its result (or its
  // "search failed" error) after the user has already walked away from it.
  const abortRef = useRef<AbortController | null>(null);

  const open = useCallback(() => {
    setVisible(true);
    setError(null);
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setVisible(false);
    setQuery('');
    setError(null);
    setResults([]);
    setLoading(false);
  }, []);

  // Deliberately does NOT fly anywhere on its own: geocoding "<city> <street> <number>" can
  // rank a same-named street in a different city first, and silently flying there is the bug
  // this replaces. The user picks which match they meant.
  const submit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const found = await searchMapboxPlaces(trimmed, null, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (found.length === 0) {
        setError('Location not found. Try a city, a street with a number, or a full address.');
        return;
      }
      setResults(found);
    } catch {
      if (controller.signal.aborted) return;
      setError('Search failed. Check your connection and try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [query]);

  const selectResult = useCallback(
    (result: MapboxSearchResult) => {
      onConfirm(result.coordinates, result.fullAddress ?? result.name);
      close();
    },
    [onConfirm, close],
  );

  const changeQuery = useCallback((text: string) => {
    setQuery(text);
    // Results belong to the previous query — keeping them on screen while the user retypes
    // invites tapping a match for something they have already moved on from.
    setResults([]);
    setError(null);
  }, []);

  return {
    visible,
    query,
    setQuery: changeQuery,
    loading,
    error,
    results,
    open,
    close,
    submit,
    selectResult,
  };
}
