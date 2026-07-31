import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { Coordinates } from '../../../models/types';
import { getDirections } from '../../../services/directions';
import { findNearestStepIndex } from '../../../shared/geo';
import { useRouteStore } from '../../../store/useRouteStore';
import { RouteOriginMode, RouteProfile } from '../types';

const WATCH_DISTANCE_INTERVAL_M = 25;
const WATCH_TIME_INTERVAL_MS = 10000;

export function useRouteDirections(gpsCoords: Coordinates | null, locationGranted: boolean = false) {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const setRoute = useRouteStore((s) => s.setRoute);
  const clearStoredRoute = useRouteStore((s) => s.clearRoute);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<Coordinates | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<RouteProfile>('walking');
  const [originMode, setOriginMode] = useState<RouteOriginMode>('gps');
  const [originPlace, setOriginPlace] = useState<{ coordinates: Coordinates; label: string } | null>(null);
  const [placePickerVisible, setPlacePickerVisible] = useState(false);
  const [nearestStepIndex, setNearestStepIndex] = useState<number | null>(null);

  // Guards against a stale in-flight request (e.g. a slow first request, or a
  // superseded live-tracking refresh) overwriting the store after a newer
  // request has already started, resolved, or been cleared.
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  function openModePicker(destination: Coordinates, label: string) {
    setPendingDestination(destination);
    setPendingLabel(label);
    setSelectedProfile('walking');
    setOriginMode('gps');
    setOriginPlace(null);
    setPickerVisible(true);
  }

  function closeModePicker() {
    setPickerVisible(false);
    // A failed/loading request left behind by a previous destination must not
    // linger in the store — otherwise reopening the picker for a new destination
    // can show stale error/loading state. A successfully-built route is kept intact.
    const current = useRouteStore.getState().activeRoute;
    if (current && current.status !== 'success') {
      requestIdRef.current++; // invalidate a loading request in flight so it can't resurrect the route
      abortRef.current?.abort();
      clearStoredRoute();
    }
  }

  function selectGpsOrigin() {
    setOriginMode('gps');
    setOriginPlace(null);
  }

  function openPlacePicker() {
    setOriginMode('place');
    setPlacePickerVisible(true);
  }

  function closePlacePicker() {
    setPlacePickerVisible(false);
  }

  function selectOriginPlace(coordinates: Coordinates, label: string) {
    setOriginPlace({ coordinates, label });
    setOriginMode('place');
    setPlacePickerVisible(false);
  }

  async function confirmRoute(profile: RouteProfile) {
    const origin =
      originMode === 'gps'
        ? gpsCoords
          ? { mode: 'gps' as const, coordinates: gpsCoords, label: 'Your location' }
          : null
        : originPlace
          ? { mode: 'place' as const, coordinates: originPlace.coordinates, label: originPlace.label }
          : null;
    if (!origin || !pendingDestination) return;

    const requestId = ++requestIdRef.current;
    setSelectedProfile(profile);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRoute({
      profile,
      origin,
      destination: pendingDestination,
      destinationLabel: pendingLabel,
      geometry: null,
      distanceMeters: null,
      durationSeconds: null,
      steps: [],
      status: 'loading',
      error: null,
    });

    try {
      const result = await getDirections(origin.coordinates, pendingDestination, profile, controller.signal);
      if (requestIdRef.current !== requestId) return; // superseded by a newer request
      setRoute({
        profile,
        origin,
        destination: pendingDestination,
        destinationLabel: pendingLabel,
        geometry: result.geometry,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        steps: result.steps,
        status: 'success',
        error: null,
      });
      setPickerVisible(false);
    } catch (err) {
      if (requestIdRef.current !== requestId) return; // superseded by a newer request
      if (err instanceof Error && err.name === 'AbortError') return;
      setRoute({
        profile,
        origin,
        destination: pendingDestination,
        destinationLabel: pendingLabel,
        geometry: null,
        distanceMeters: null,
        durationSeconds: null,
        steps: [],
        status: 'error',
        error: 'Could not get directions. Try again.',
      });
    }
  }

  function clearRoute() {
    requestIdRef.current++; // invalidate any in-flight request so it can't resurrect the route
    abortRef.current?.abort();
    clearStoredRoute();
    setPickerVisible(false);
    setPendingDestination(null);
    setNearestStepIndex(null);
  }

  async function refreshRouteFromPosition(coords: Coordinates) {
    const current = useRouteStore.getState().activeRoute;
    if (!current || current.origin.mode !== 'gps' || current.status !== 'success') return;

    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await getDirections(coords, current.destination, current.profile, controller.signal);
      if (requestIdRef.current !== requestId) return;
      const latest = useRouteStore.getState().activeRoute;
      if (!latest || latest.origin.mode !== 'gps' || latest.status !== 'success') return;
      setRoute({
        ...latest,
        origin: { mode: 'gps', coordinates: coords, label: 'Your location' },
        geometry: result.geometry,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        steps: result.steps,
      });
    } catch {
      // A stale-position refresh failing is silent — keep showing the last good route.
    }
  }

  function updateNearestStep(coords: Coordinates) {
    const current = useRouteStore.getState().activeRoute;
    setNearestStepIndex(current ? findNearestStepIndex(coords, current.steps) : null);
  }

  // Live navigation: while a GPS-origin route is active and the app is foregrounded,
  // watch position and silently recalculate the route in place. Stopped on background
  // to save battery, resumed with an immediate refresh on foreground.
  useEffect(() => {
    if (!locationGranted) return undefined;
    if (!activeRoute || activeRoute.origin.mode !== 'gps' || activeRoute.status !== 'success') {
      return undefined;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function startTracking() {
      if (gpsCoords) {
        updateNearestStep(gpsCoords);
        await refreshRouteFromPosition(gpsCoords);
      }
      if (cancelled) return;
      const newSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: WATCH_DISTANCE_INTERVAL_M,
          timeInterval: WATCH_TIME_INTERVAL_MS,
        },
        (loc) => {
          if (cancelled) return;
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          updateNearestStep(coords);
          void refreshRouteFromPosition(coords);
        },
      );
      // Cleanup may have run while watchPositionAsync was still resolving (it's async
      // and can take a while to set up native location updates) — in that case stopTracking()
      // already ran and found `subscription` still null, so the subscription it hands back
      // now would otherwise never be removed. Remove it immediately instead of leaking it.
      if (cancelled) {
        newSubscription.remove();
        return;
      }
      subscription = newSubscription;
    }

    function stopTracking() {
      subscription?.remove();
      subscription = null;
    }

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        void startTracking();
      } else {
        stopTracking();
      }
    }

    if (AppState.currentState === 'active') void startTracking();
    const subscriptionHandle = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      stopTracking();
      subscriptionHandle.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationGranted,
    gpsCoords,
    activeRoute?.origin.mode,
    activeRoute?.status,
    activeRoute?.destination.latitude,
    activeRoute?.destination.longitude,
  ]);

  return {
    activeRoute,
    pickerVisible,
    pendingLabel,
    selectedProfile,
    hasLocation: !!gpsCoords,
    hasOrigin: originMode === 'gps' ? !!gpsCoords : !!originPlace,
    originMode,
    originLabel: originMode === 'place' ? (originPlace?.label ?? 'Choose a place') : 'My location',
    placePickerVisible,
    nearestStepIndex,
    setSelectedProfile,
    openModePicker,
    closeModePicker,
    confirmRoute,
    clearRoute,
    selectGpsOrigin,
    openPlacePicker,
    closePlacePicker,
    selectOriginPlace,
  };
}
