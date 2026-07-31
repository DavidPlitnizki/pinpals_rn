import { Coordinates, MemoryMood, PlaceCategory } from '../../models/types';
import { MapboxSearchResult } from '../../services/mapboxSearch';

export interface AddPlaceState {
  name: string;
  category: PlaceCategory;
  rating: number;
  description: string;
  coordinates: Coordinates | null;
}

export interface QuickAddPlaceState {
  name: string;
  rating: number;
  description: string;
  photoUris: string[];
  mood?: MemoryMood;
  coordinates: Coordinates | null;
  createdAt: string;
}

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
