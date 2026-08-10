import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { Coordinates } from '../../../models/types';
import { reverseGeocodePlace } from '../../../services/mapboxSearch';
import {
  CurrentWeather,
  DailyWeatherPoint,
  fetchCurrentWeather,
  fetchDailyWeather,
  fetchHourlyWeather,
  geocodeLocation,
  GeocodedPlace,
  HourlyWeatherPoint,
} from '../../../services/weather';

export const MIN_SEARCH_QUERY_LENGTH = 2;

export function useWeatherDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  // Where the map camera was when the badge was tapped — the screen's starting location,
  // before the user searches somewhere else.
  const initialCoords = useMemo<Coordinates>(
    () => ({
      latitude: Number(params.latitude) || 0,
      longitude: Number(params.longitude) || 0,
    }),
    [params.latitude, params.longitude],
  );

  const [coords, setCoords] = useState(initialCoords);
  const [locationLabel, setLocationLabel] = useState('Map location');
  // Guards the initial reverse-geocode below from clobbering a label the user already set by
  // picking a search result while that lookup was still in flight.
  const hasCustomLabelRef = useRef(false);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyWeatherPoint[]>([]);
  const [daily, setDaily] = useState<DailyWeatherPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setLoading(true);
      const [currentResult, hourlyResult, dailyResult] = await Promise.all([
        fetchCurrentWeather(coords),
        fetchHourlyWeather(coords),
        fetchDailyWeather(coords),
      ]);
      if (cancelled) return;
      setCurrent(currentResult);
      setHourly(hourlyResult);
      setDaily(dailyResult);
      setLoading(false);
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, [coords]);

  useEffect(() => {
    let cancelled = false;

    async function search() {
      const trimmed = debouncedQuery.trim();
      if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const results = await geocodeLocation(trimmed);
      if (!cancelled) {
        setSearchResults(results);
        setSearching(false);
      }
    }

    void search();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // One-time reverse geocode of wherever the map camera was pointed, so the screen opens
  // naming an actual city/country instead of the generic "Map location" placeholder.
  useEffect(() => {
    let cancelled = false;

    async function loadLocationLabel() {
      const label = await reverseGeocodePlace(initialCoords);
      if (!cancelled && label && !hasCustomLabelRef.current) {
        setLocationLabel(label);
      }
    }

    void loadLocationLabel();
    return () => {
      cancelled = true;
    };
  }, [initialCoords]);

  const selectResult = useCallback((place: GeocodedPlace) => {
    hasCustomLabelRef.current = true;
    setCoords(place.coordinates);
    setLocationLabel([place.name, place.admin1, place.country].filter(Boolean).join(', '));
    setQuery('');
    setSearchResults([]);
  }, []);

  const close = useCallback(() => router.back(), [router]);

  return {
    locationLabel,
    current,
    hourly,
    daily,
    loading,
    query,
    setQuery,
    searchResults,
    searching,
    selectResult,
    close,
  };
}
