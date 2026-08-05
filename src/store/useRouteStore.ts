import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveRoute, RouteOrigin } from '../features/map/types';
import { Coordinates } from '../models/types';

interface RouteState {
  activeRoute: ActiveRoute | null;
  setRoute: (route: ActiveRoute) => void;
  clearRoute: () => void;
}

// Pre-origin-picker persisted routes stored `origin` as bare Coordinates (always
// GPS-derived, since that was the only option). Detect that shape and backfill it.
function sanitizeOrigin(origin: unknown): RouteOrigin {
  if (origin && typeof origin === 'object' && 'mode' in origin) {
    return origin as RouteOrigin;
  }
  return { mode: 'gps', coordinates: origin as Coordinates, label: 'Your location' };
}

// Pre-waypoints persisted routes stored a single `destination`/`destinationLabel` pair
// instead of a `waypoints` list. Detect that shape and wrap it into a one-stop list.
function sanitizeWaypoints(route: unknown): ActiveRoute['waypoints'] {
  const r = route as { waypoints?: unknown; destination?: Coordinates; destinationLabel?: string };
  if (Array.isArray(r.waypoints)) return r.waypoints as ActiveRoute['waypoints'];
  if (r.destination) return [{ coordinates: r.destination, label: r.destinationLabel ?? '' }];
  return [];
}

// Only a 'success' route with geometry is meaningful across app restarts —
// a rehydrated 'loading' or 'error' state would be stuck with no way to retry.
function sanitizeRoute(route: ActiveRoute | null | undefined): ActiveRoute | null {
  if (!route || route.status !== 'success' || !route.geometry) return null;
  const waypoints = sanitizeWaypoints(route);
  if (waypoints.length === 0) return null;
  // Built explicitly (not `...route`) so a legacy persisted `destination`/`destinationLabel`
  // pair doesn't leak through alongside the `waypoints` list it's been converted into.
  return {
    profile: route.profile,
    origin: sanitizeOrigin(route.origin),
    waypoints,
    geometry: route.geometry,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    steps: route.steps ?? [],
    status: route.status,
    error: route.error,
  };
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      activeRoute: null,
      setRoute: (route) => set({ activeRoute: route }),
      clearRoute: () => set({ activeRoute: null }),
    }),
    {
      name: 'pinpals-route',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState, currentState) => ({
        ...currentState,
        activeRoute: sanitizeRoute(
          (persistedState as Partial<RouteState> | undefined)?.activeRoute,
        ),
      }),
    },
  ),
);
