import { useCallback, useEffect, useRef, useState } from 'react';

import { Coordinates } from '../../../models/types';
import { CurrentWeather, fetchCurrentWeather } from '../../../services/weather';
import { bboxContains } from '../../../shared/geo';

type Bbox = [number, number, number, number];
type GetVisibleBbox = () => Promise<Bbox | undefined>;

const CAMERA_SETTLE_DEBOUNCE_MS = 500;
// A glance icon, not a live forecast — refreshing periodically while the camera stays put
// keeps it fresh enough while staying well inside Open-Meteo's free-tier daily call limit.
const STALE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

// Drives the small weather badge on the map: fetches once GPS is known, then re-checks
// whenever the camera settles somewhere outside the bbox the last fetch covered — mirrors
// useQuickCategorySearch's "has the viewport moved past what we already have" check, but
// refetches silently instead of surfacing a "search here" button (a single low-stakes value,
// not a results list worth asking permission to replace).
export function useWeather(
  gpsCoords: Coordinates | null,
  getMapCenter: () => Coordinates,
  getVisibleBbox: GetVisibleBbox,
) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const lastFetchedBboxRef = useRef<Bbox | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    const bbox = await getVisibleBbox();
    lastFetchedBboxRef.current = bbox ?? null;
    const result = await fetchCurrentWeather(getMapCenter());
    setWeather(result);
  }, [getMapCenter, getVisibleBbox]);

  // First fetch, once we actually know where the user is — before that, the map center is
  // still the default placeholder, not a real location worth asking the weather for.
  useEffect(() => {
    if (!gpsCoords || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void refresh();
  }, [gpsCoords, refresh]);

  useEffect(() => {
    if (!hasFetchedRef.current) return;
    const interval = setInterval(refresh, STALE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const checkBoundsAndRefresh = useCallback(async () => {
    const bbox = await getVisibleBbox();
    if (bbox && lastFetchedBboxRef.current && bboxContains(lastFetchedBboxRef.current, bbox)) {
      return;
    }
    void refresh();
  }, [getVisibleBbox, refresh]);

  const onCameraSettled = useCallback(() => {
    if (!hasFetchedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void checkBoundsAndRefresh(), CAMERA_SETTLE_DEBOUNCE_MS);
  }, [checkBoundsAndRefresh]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { weather, onCameraSettled, refresh };
}
