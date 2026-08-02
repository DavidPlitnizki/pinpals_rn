import { Spacing } from '../../design-system/tokens';

export { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../../shared/constants';

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

export const DEFAULT_CENTER: [number, number] = [0, 0];
export const DEFAULT_ZOOM = 13;
export const ZOOM_DELTA = 1;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 20;

export const ROUTE_LINE_COLOR = '#3E7CE8';
export const ROUTE_LINE_WIDTH = 4;

export const DEFAULT_RADIUS_M = 5000;
export const MAX_RADIUS_M = 50000;
