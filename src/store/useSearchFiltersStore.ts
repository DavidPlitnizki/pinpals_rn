import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaceCategory } from '../models/types';
import { DEFAULT_RADIUS_M } from '../features/map/constants';
import { SpecialFilter } from '../features/map/types';

interface SearchFiltersState {
  query: string;
  activeCategories: PlaceCategory[];
  specialFilters: SpecialFilter[];
  radiusM: number;
  radiusEnabled: boolean;
  alwaysShowFavorites: boolean;

  setQuery: (query: string) => void;
  setActiveCategories: (categories: PlaceCategory[]) => void;
  setSpecialFilters: (filters: SpecialFilter[]) => void;
  setRadiusM: (radiusM: number) => void;
  setRadiusEnabled: (enabled: boolean) => void;
  setAlwaysShowFavorites: (enabled: boolean) => void;
  resetFilters: () => void;
}

const DEFAULTS = {
  query: '',
  activeCategories: [] as PlaceCategory[],
  specialFilters: [] as SpecialFilter[],
  radiusM: DEFAULT_RADIUS_M,
  radiusEnabled: true,
  alwaysShowFavorites: true,
};

export const useSearchFiltersStore = create<SearchFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setQuery: (query) => set({ query }),
      setActiveCategories: (activeCategories) => set({ activeCategories }),
      setSpecialFilters: (specialFilters) => set({ specialFilters }),
      setRadiusM: (radiusM) => set({ radiusM }),
      setRadiusEnabled: (radiusEnabled) => set({ radiusEnabled }),
      setAlwaysShowFavorites: (alwaysShowFavorites) => set({ alwaysShowFavorites }),
      resetFilters: () =>
        set({
          query: DEFAULTS.query,
          activeCategories: DEFAULTS.activeCategories,
          specialFilters: DEFAULTS.specialFilters,
          radiusM: DEFAULTS.radiusM,
          radiusEnabled: DEFAULTS.radiusEnabled,
        }),
    }),
    {
      name: 'pinpals-search-filters',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
