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

// Only a 'success' route with geometry is meaningful across app restarts —
// a rehydrated 'loading' or 'error' state would be stuck with no way to retry.
function sanitizeRoute(route: ActiveRoute | null | undefined): ActiveRoute | null {
  if (!route || route.status !== 'success' || !route.geometry) return null;
  return { ...route, origin: sanitizeOrigin(route.origin), steps: route.steps ?? [] };
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
        activeRoute: sanitizeRoute((persistedState as Partial<RouteState> | undefined)?.activeRoute),
      }),
    },
  ),
);
