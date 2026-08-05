import { ColorSchemeName, PixelRatio, useColorScheme } from 'react-native';

import { FONT_SCALE_MULTIPLIERS, ThemePreference, useSettingsStore } from '../store/useSettingsStore';

// RN's <Text>/<TextInput> multiply their fontSize by PixelRatio.getFontScale() whenever
// allowFontScaling isn't explicitly turned off (the default everywhere in this app) — so
// overriding it here is what makes the in-app "Font Size" setting apply everywhere without
// touching every screen's styles. Captured once so the multiplier composes with the
// device's own accessibility text-size setting instead of replacing it.
const deviceFontScale = PixelRatio.getFontScale();

export function applyFontScale(scale: keyof typeof FONT_SCALE_MULTIPLIERS): void {
  PixelRatio.getFontScale = () => deviceFontScale * FONT_SCALE_MULTIPLIERS[scale];
}

export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();
  return resolveTheme(preference, systemScheme);
}

function resolveTheme(preference: ThemePreference, systemScheme: ColorSchemeName) {
  if (preference === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return preference;
}
