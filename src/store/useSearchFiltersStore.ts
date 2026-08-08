import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchFiltersState {
  query: string;

  setQuery: (query: string) => void;
  resetFilters: () => void;
}

const DEFAULTS = {
  query: '',
};

export const useSearchFiltersStore = create<SearchFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setQuery: (query) => set({ query }),
      resetFilters: () => set({ query: DEFAULTS.query }),
    }),
    {
      name: 'pinpals-search-filters',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
