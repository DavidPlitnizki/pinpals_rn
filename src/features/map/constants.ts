import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

import { Spacing } from '../../design-system/tokens';

export { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../../shared/constants';

export interface QuickSearchCategory {
  key: string;
  label: string;
  // Text sent to Mapbox's forward search — deliberately generic ("coffee shop", not a
  // specific chain) so it works as a category browse, not a name lookup.
  query: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  // Each chip gets its own border/fill color instead of one flat brand-green row — makes the
  // row scannable at a glance and less monotonous.
  color: string;
}

// Quick-filter row under the top search bar (Google/Apple Maps style) — the fixed set of
// travel-essential categories, not the user's own Place.category enum.
export const QUICK_SEARCH_CATEGORIES: QuickSearchCategory[] = [
  {
    key: 'restaurants',
    label: 'Restaurants',
    query: 'restaurant',
    icon: 'silverware-fork-knife',
    color: '#E8834A',
  },
  { key: 'cafes', label: 'Cafes', query: 'coffee shop', icon: 'coffee', color: '#8B6347' },
  { key: 'parks', label: 'Parks', query: 'park', icon: 'tree', color: '#4A7C59' },
  { key: 'parking', label: 'Parking', query: 'parking', icon: 'parking', color: '#3D9BE9' },
  { key: 'gas', label: 'Gas Stations', query: 'gas station', icon: 'gas-station', color: '#E4483C' },
  { key: 'malls', label: 'Malls', query: 'shopping mall', icon: 'shopping', color: '#9C6ADE' },
  {
    key: 'hospitals',
    label: 'Hospitals',
    query: 'hospital',
    icon: 'hospital-box',
    color: '#F27DA5',
  },
  { key: 'hotels', label: 'Hotels', query: 'hotel', icon: 'bed', color: '#6C63FF' },
  { key: 'atms', label: 'ATMs', query: 'atm', icon: 'atm', color: '#F5C518' },
  { key: 'pharmacies', label: 'Pharmacies', query: 'pharmacy', icon: 'pill', color: '#2AB6A8' },
  { key: 'museums', label: 'Museums', query: 'museum', icon: 'bank', color: '#C9A227' },
  {
    key: 'landmarks',
    label: 'Landmarks',
    query: 'tourist attraction',
    icon: 'castle',
    color: '#607D8B',
  },
];

// Shared hitSlop objects — a literal `hitSlop={{...}}` prop is re-allocated every render;
// reuse these stable references instead.
export const HIT_SLOP_8 = {
  top: Spacing.s8,
  bottom: Spacing.s8,
  left: Spacing.s8,
  right: Spacing.s8,
};
export const HIT_SLOP_16 = {
  top: Spacing.s16,
  bottom: Spacing.s16,
  left: Spacing.s16,
  right: Spacing.s16,
};

// Height of MapSearchBar's content (pill + quick-chip row, safe-area top padding excluded):
// pill marginTop(8) + pill height(48) + chips row paddingTop(8) + chip height(32). The red
// clear buttons anchor below this so they never sit under the search bar/chips.
export const MAP_SEARCH_BAR_HEIGHT = 96;

export const DEFAULT_CENTER: [number, number] = [0, 0];
export const DEFAULT_ZOOM = 13;
export const ZOOM_DELTA = 1;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 20;

export const ROUTE_LINE_COLOR = '#3E7CE8';
export const ROUTE_LINE_WIDTH = 4;
