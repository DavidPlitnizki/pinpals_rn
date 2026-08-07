import { useCallback, useState } from 'react';

import { Coordinates } from '../../../models/types';
import { searchMapboxPlaces } from '../../../services/mapboxSearch';
import { parseCoordinates } from '../utils/parseCoordinates';

export function useFlyToSheet(onConfirm: (coordinates: Coordinates, label: string) => void) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(() => {
    setVisible(true);
    setError(null);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setQuery('');
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const parsed = parseCoordinates(trimmed);
    if (parsed) {
      onConfirm(parsed, `${parsed.latitude.toFixed(4)}, ${parsed.longitude.toFixed(4)}`);
      close();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await searchMapboxPlaces(trimmed, null);
      if (results.length === 0) {
        setError('Location not found. Try a different name, or enter "lat, lng".');
        return;
      }
      const top = results[0];
      onConfirm(top.coordinates, top.fullAddress ?? top.name);
      close();
    } catch {
      setError('Search failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [query, onConfirm, close]);

  return { visible, query, setQuery, loading, error, open, close, submit };
}
