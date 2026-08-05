import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProfile, RouteWaypoint, SavedRoute } from '../features/map/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface SavedRoutesState {
  savedRoutes: SavedRoute[];
  addSavedRoute: (name: string, waypoints: RouteWaypoint[], profile: RouteProfile) => string;
  deleteSavedRoute: (id: string) => void;
}

export const useSavedRoutesStore = create<SavedRoutesState>()(
  persist(
    (set) => ({
      savedRoutes: [],

      addSavedRoute: (name, waypoints, profile) => {
        const route: SavedRoute = {
          id: generateId(),
          name,
          waypoints,
          profile,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ savedRoutes: [route, ...state.savedRoutes] }));
        return route.id;
      },

      deleteSavedRoute: (id) => {
        set((state) => ({ savedRoutes: state.savedRoutes.filter((r) => r.id !== id) }));
      },
    }),
    {
      name: 'pinpals-saved-routes',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
