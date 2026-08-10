import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

import { PlaceCategory } from '../models/types';

export const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: '#E8834A',
  coffee: '#8B6347',
  nature: '#4A7C59',
  art: '#9C6ADE',
  sports: '#3D9BE9',
};

// Ultimate cover-image fallback (no photo, no Wikipedia hit, no Mapbox token) — a plain
// category-colored icon block instead of a generic gray box.
export const CATEGORY_ICONS: Record<PlaceCategory, ComponentProps<typeof Ionicons>['name']> = {
  food: 'restaurant-outline',
  coffee: 'cafe-outline',
  nature: 'leaf-outline',
  art: 'color-palette-outline',
  sports: 'basketball-outline',
};

export const CATEGORIES: PlaceCategory[] = ['food', 'nature', 'art', 'sports', 'coffee'];

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

// Preset swatches for the user-chosen pin color (Place.pinColor). Undefined/unselected falls
// back to Colors.myPlace (turquoise) wherever the pin is drawn — this list intentionally
// excludes that default so "no color chosen" and "chose the default-looking teal" stay
// distinguishable in the picker UI.
export const PIN_COLOR_PRESETS: string[] = [
  '#E4483C', // red
  '#E8834A', // orange
  '#F5C518', // yellow
  '#4A7C59', // green
  '#3D9BE9', // blue
  '#6C63FF', // indigo
  '#9C6ADE', // purple
  '#F27DA5', // pink
];
