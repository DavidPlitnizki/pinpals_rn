import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontScale = 'small' | 'medium' | 'large';
export type ThemePreference = 'light' | 'dark' | 'system';

// Multiplier applied on top of the device's own accessibility text-size setting so the
// in-app choice and OS "Larger Text" setting compose instead of one silently overriding
// the other.
export const FONT_SCALE_MULTIPLIERS: Record<FontScale, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

interface SettingsState {
  fontScale: FontScale;
  theme: ThemePreference;
  setFontScale: (scale: FontScale) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontScale: 'medium',
      theme: 'system',
      setFontScale: (fontScale) => set({ fontScale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'pinpals-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
