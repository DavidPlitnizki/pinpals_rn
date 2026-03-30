import { Region } from "react-native-maps";

export { CATEGORY_COLORS, CATEGORIES, CATEGORY_LABELS } from "../../shared/constants";

export const DEFAULT_REGION: Region = {
  latitude: 40.785091,
  longitude: -73.968285,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const ZOOM_IN = 0.5;
export const ZOOM_OUT = 2;
export const MIN_DELTA = 0.0005;
export const MAX_DELTA = 80;
