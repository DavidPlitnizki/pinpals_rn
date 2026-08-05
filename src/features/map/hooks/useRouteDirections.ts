import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { Coordinates } from '../../../models/types';
import { DirectionsResult, getDirections } from '../../../services/directions';
import { findNearestStepIndex, haversineMeters } from '../../../shared/geo';
import { useRouteStore } from '../../../store/useRouteStore';
import { RouteProfile, RoutePreview, RouteWaypoint } from '../types';

const WATCH_DISTANCE_INTERVAL_M = 25;
const WATCH_TIME_INTERVAL_MS = 10000;
const PREVIEW_PROFILES: RouteProfile[] = ['walking', 'driving', 'cycling'];
// "Close enough" to a waypoint to count as arrived — GPS accuracy on foot/in a vehicle is
// rarely better than a few meters, so this isn't meant to be exact.
const WAYPOINT_REACHED_THRESHOLD_M = 10;

export function useRouteDirections(
  gpsCoords: Coordinates | null,
  locationGranted: boolean = false,
  onWaypointReached?: (label: string) => void,
) {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const setRoute = useRouteStore((s) => s.setRoute);
  const clearStoredRoute = useRouteStore((s) => s.clearRoute);

  const [pickerVisible, setPickerVisible] = useState(false);
  // The full stop list (after the origin) being built in the picker — one entry for a
  // plain trip, more if this continues an already-active route (see openModePicker).
  const [pendingWaypoints, setPendingWaypoints] = useState<RouteWaypoint[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<RouteProfile>('walking');
  const [nearestStepIndex, setNearestStepIndex] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Partial<Record<RouteProfile, RoutePreview>>>({});

  const pendingLabel = pendingWaypoints[pendingWaypoints.length - 1]?.label ?? '';

  // Guards against a stale in-flight request (e.g. a slow first request, or a
  // superseded live-tracking refresh) overwriting the store after a newer
  // request has already started, resolved, or been cleared.
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const previewResultsRef = useRef<Partial<Record<RouteProfile, DirectionsResult>>>({});
  const previewRequestIdRef = useRef(0);

  // Opening the picker while a route is already confirmed extends that route with this
  // point as a new stop (origin → ...existing stops → new point) instead of discarding it
  // and starting a fresh A→B trip.
  const openModePicker = useCallback(
    (destination: Coordinates, label: string) => {
      const priorWaypoints = activeRoute?.status === 'success' ? activeRoute.waypoints : [];
      const nextWaypoints = [...priorWaypoints, { coordinates: destination, label }];
      setPendingWaypoints(nextWaypoints);
      setSelectedProfile('walking');
      setPickerVisible(true);

      previewResultsRef.current = {};
      const previewRequestId = ++previewRequestIdRef.current;
      if (!gpsCoords) {
        setPreviews({});
        return;
      }

      setPreviews({
        walking: { status: 'loading' },
        driving: { status: 'loading' },
        cycling: { status: 'loading' },
      });

      const points = [gpsCoords, ...nextWaypoints.map((w) => w.coordinates)];
      PREVIEW_PROFILES.forEach((profile) => {
        getDirections(points, profile)
          .then((result) => {
            if (previewRequestIdRef.current !== previewRequestId) return;
            previewResultsRef.current[profile] = result;
            setPreviews((prev) => ({
              ...prev,
              [profile]: {
                status: 'success',
                distanceMeters: result.distanceMeters,
                durationSeconds: result.durationSeconds,
              },
            }));
          })
          .catch(() => {
            if (previewRequestIdRef.current !== previewRequestId) return;
            setPreviews((prev) => ({ ...prev, [profile]: { status: 'error' } }));
          });
      });
    },
    [activeRoute, gpsCoords],
  );

  const closeModePicker = useCallback(() => {
    setPickerVisible(false);
    setPendingWaypoints([]);
    // A failed/loading request left behind by a previous destination must not
    // linger in the store — otherwise reopening the picker for a new destination
    // can show stale error/loading state. A successfully-built route is kept intact.
    const current = useRouteStore.getState().activeRoute;
    if (current && current.status !== 'success') {
      requestIdRef.current++; // invalidate a loading request in flight so it can't resurrect the route
      abortRef.current?.abort();
      clearStoredRoute();
    }
  }, [clearStoredRoute]);

  const confirmRoute = useCallback(
    async (profile: RouteProfile) => {
      if (!gpsCoords || pendingWaypoints.length === 0) return;
      const origin = { mode: 'gps' as const, coordinates: gpsCoords, label: 'Your location' };
      const waypoints = pendingWaypoints;

      setSelectedProfile(profile);

      const cached = previewResultsRef.current[profile];
      if (cached) {
        requestIdRef.current++; // invalidate any in-flight confirm request
        abortRef.current?.abort();
        setRoute({
          profile,
          origin,
          waypoints,
          geometry: cached.geometry,
          distanceMeters: cached.distanceMeters,
          durationSeconds: cached.durationSeconds,
          steps: cached.steps,
          status: 'success',
          error: null,
        });
        setPickerVisible(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setRoute({
        profile,
        origin,
        waypoints,
        geometry: null,
        distanceMeters: null,
        durationSeconds: null,
        steps: [],
        status: 'loading',
        error: null,
      });

      try {
        const result = await getDirections(
          [origin.coordinates, ...waypoints.map((w) => w.coordinates)],
          profile,
          controller.signal,
        );
        if (requestIdRef.current !== requestId) return; // superseded by a newer request
        setRoute({
          profile,
          origin,
          waypoints,
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
          waypoints,
          geometry: null,
          distanceMeters: null,
          durationSeconds: null,
          steps: [],
          status: 'error',
          error: 'Could not get directions. Try again.',
        });
      }
    },
    [gpsCoords, pendingWaypoints, setRoute],
  );

  // Loads a saved route template directly onto the map — recomputes directions from
  // wherever the user is right now, skipping the mode picker entirely (the profile was
  // already chosen when the route was saved).
  const loadSavedRoute = useCallback(
    async (waypoints: RouteWaypoint[], profile: RouteProfile) => {
      if (!gpsCoords || waypoints.length === 0) return;
      const origin = { mode: 'gps' as const, coordinates: gpsCoords, label: 'Your location' };

      setSelectedProfile(profile);
      const requestId = ++requestIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setRoute({
        profile,
        origin,
        waypoints,
        geometry: null,
        distanceMeters: null,
        durationSeconds: null,
        steps: [],
        status: 'loading',
        error: null,
      });

      try {
        const result = await getDirections(
          [origin.coordinates, ...waypoints.map((w) => w.coordinates)],
          profile,
          controller.signal,
        );
        if (requestIdRef.current !== requestId) return; // superseded by a newer request
        setRoute({
          profile,
          origin,
          waypoints,
          geometry: result.geometry,
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
          steps: result.steps,
          status: 'success',
          error: null,
        });
      } catch (err) {
        if (requestIdRef.current !== requestId) return; // superseded by a newer request
        if (err instanceof Error && err.name === 'AbortError') return;
        setRoute({
          profile,
          origin,
          waypoints,
          geometry: null,
          distanceMeters: null,
          durationSeconds: null,
          steps: [],
          status: 'error',
          error: 'Could not get directions. Try again.',
        });
      }
    },
    [gpsCoords, setRoute],
  );

  const clearRoute = useCallback(() => {
    requestIdRef.current++; // invalidate any in-flight request so it can't resurrect the route
    abortRef.current?.abort();
    clearStoredRoute();
    setPickerVisible(false);
    setPendingWaypoints([]);
    setNearestStepIndex(null);
  }, [clearStoredRoute]);

  // A short press on ClearRouteButton drops just the most recently added stop (mirrors
  // openModePicker's "extend the route" behavior in reverse); dropping the last remaining
  // stop is equivalent to clearing the whole route.
  const removeLastWaypoint = useCallback(async () => {
    const current = useRouteStore.getState().activeRoute;
    if (!current || current.status !== 'success' || current.waypoints.length === 0) return;

    const waypoints = current.waypoints.slice(0, -1);
    if (waypoints.length === 0) {
      clearRoute();
      return;
    }

    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRoute({ ...current, waypoints, status: 'loading', error: null });

    try {
      const result = await getDirections(
        [current.origin.coordinates, ...waypoints.map((w) => w.coordinates)],
        current.profile,
        controller.signal,
      );
      if (requestIdRef.current !== requestId) return; // superseded by a newer request
      setRoute({
        ...current,
        waypoints,
        geometry: result.geometry,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        steps: result.steps,
        status: 'success',
        error: null,
      });
    } catch (err) {
      if (requestIdRef.current !== requestId) return; // superseded by a newer request
      if (err instanceof Error && err.name === 'AbortError') return;
      setRoute({
        ...current,
        waypoints,
        status: 'error',
        error: 'Could not get directions. Try again.',
      });
    }
  }, [clearRoute, setRoute]);

  async function refreshRouteFromPosition(coords: Coordinates) {
    const current = useRouteStore.getState().activeRoute;
    if (!current || current.origin.mode !== 'gps' || current.status !== 'success') return;

    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await getDirections(
        [coords, ...current.waypoints.map((w) => w.coordinates)],
        current.profile,
        controller.signal,
      );
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

  // Drops the next stop once the user is within WAYPOINT_REACHED_THRESHOLD_M of it —
  // doesn't need to be exact, GPS accuracy on foot/in a vehicle rarely is. Returns true if a
  // stop was reached (so the caller can skip the redundant refreshRouteFromPosition call for
  // this same GPS tick — both would otherwise race over requestIdRef/abortRef).
  async function checkWaypointReached(coords: Coordinates): Promise<boolean> {
    const current = useRouteStore.getState().activeRoute;
    if (!current || current.status !== 'success' || current.waypoints.length === 0) return false;

    const next = current.waypoints[0];
    if (haversineMeters(coords, next.coordinates) > WAYPOINT_REACHED_THRESHOLD_M) return false;

    onWaypointReached?.(next.label);

    const waypoints = current.waypoints.slice(1);
    if (waypoints.length === 0) {
      clearRoute();
      return true;
    }

    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const origin = { mode: 'gps' as const, coordinates: coords, label: 'Your location' };

    setRoute({ ...current, origin, waypoints, status: 'loading', error: null });

    try {
      const result = await getDirections(
        [coords, ...waypoints.map((w) => w.coordinates)],
        current.profile,
        controller.signal,
      );
      if (requestIdRef.current !== requestId) return true;
      setRoute({
        ...current,
        origin,
        waypoints,
        geometry: result.geometry,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        steps: result.steps,
        status: 'success',
        error: null,
      });
    } catch {
      // Leave the route as-is on failure — reached-detection isn't the source of truth for
      // whether the trip continues, and dropping to an error state here would be jarring.
    }
    return true;
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
        const reached = await checkWaypointReached(gpsCoords);
        if (!reached) await refreshRouteFromPosition(gpsCoords);
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
          void checkWaypointReached(coords).then((reached) => {
            if (!cancelled && !reached) void refreshRouteFromPosition(coords);
          });
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
    activeRoute?.waypoints,
  ]);

  return {
    activeRoute,
    pickerVisible,
    pendingWaypoints,
    pendingLabel,
    selectedProfile,
    hasLocation: !!gpsCoords,
    previews,
    nearestStepIndex,
    setSelectedProfile,
    openModePicker,
    closeModePicker,
    confirmRoute,
    clearRoute,
    removeLastWaypoint,
    loadSavedRoute,
  };
}
