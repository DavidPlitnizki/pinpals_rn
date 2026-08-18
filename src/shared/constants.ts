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

// Neutral stand-ins for a place with no category — the common case, since the app never
// asks for one.
export const DEFAULT_CATEGORY_COLOR = '#4A7C59';
export const DEFAULT_CATEGORY_ICON: ComponentProps<typeof Ionicons>['name'] = 'location-outline';

export function categoryColor(category?: PlaceCategory): string {
  return category ? CATEGORY_COLORS[category] : DEFAULT_CATEGORY_COLOR;
}

export function categoryIcon(category?: PlaceCategory): ComponentProps<typeof Ionicons>['name'] {
  return category ? CATEGORY_ICONS[category] : DEFAULT_CATEGORY_ICON;
}

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

// The fixed vocabulary of tags a place can carry. Kept closed (no free text) so tags stay
// comparable across places — the remembrance filters group by exact tag string.
export const PRESET_TAGS: string[] = [
  'food',
  'coffee',
  'nature',
  'art',
  'sports',
  'bar',
  'club',
  'nightlife',
  'shopping',
  'view',
  'hidden gem',
  'date',
  'family',
  'work',
];

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
