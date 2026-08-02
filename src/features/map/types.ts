import { Coordinates } from '../../models/types';
import { MapboxSearchResult } from '../../services/mapboxSearch';

export type PendingSearchMarker = MapboxSearchResult;

// A native basemap POI (built into the Mapbox style, not app data) resolved via
// queryRenderedFeaturesAtPoint on tap. `maki`/`category` reliability depends on the
// active style exposing those fields (true for Mapbox Streets' poi_label layer).
export interface NativePoiMarker {
  id: string;
  name: string;
  maki?: string;
  category?: string;
  coordinates: Coordinates;
}

export type SpecialFilter = 'mine' | 'favorites';

export type RouteProfile = 'walking' | 'driving' | 'cycling';
export type RouteStatus = 'idle' | 'loading' | 'success' | 'error';
export type RouteOriginMode = 'gps' | 'place';

export interface RouteOrigin {
  mode: RouteOriginMode;
  coordinates: Coordinates;
  label: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  maneuverLocation: Coordinates;
}

export interface RoutePreview {
  status: 'loading' | 'success' | 'error';
  distanceMeters?: number;
  durationSeconds?: number;
}

export interface ActiveRoute {
  profile: RouteProfile;
  origin: RouteOrigin;
  destination: Coordinates;
  destinationLabel: string;
  geometry: GeoJSON.LineString | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  steps: RouteStep[];
  status: RouteStatus;
  error: string | null;
}
