import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_MAP_STYLE, MapStyleId } from '../features/map/mapStyles';

interface MapStyleState {
  styleId: MapStyleId;
  setStyleId: (styleId: MapStyleId) => void;
}

// Persisted because picking a base map is a decision about how you like to read the map, not
// something to redo every launch — someone who switched to Satellite means it.
export const useMapStyleStore = create<MapStyleState>()(
  persist(
    (set) => ({
      styleId: DEFAULT_MAP_STYLE,
      setStyleId: (styleId) => set({ styleId }),
    }),
    {
      name: 'pinpals-map-style',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
