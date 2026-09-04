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
  // Set for a point the user long-pressed: everything the reverse lookup could find was
  // resolved on the way to building this marker, so the callout must not look anything up
  // again — an absent field here means "known to be unavailable", not "not asked yet". A
  // basemap POI tapped from the map leaves this undefined and the callout does its own lookup.
  resolvedDetails?: { address?: string; phone?: string; website?: string };
  // True while the reverse lookup behind a long press is still in flight. The card is on
  // screen already — showing it immediately is the point — but its name is a placeholder.
  pending?: boolean;
}

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

// A stop after the origin, in visiting order. A plain A→B trip has exactly one; requesting
// directions again while a route is already active appends another instead of starting over.
export interface RouteWaypoint {
  coordinates: Coordinates;
  label: string;
}

export interface ActiveRoute {
  profile: RouteProfile;
  origin: RouteOrigin;
  waypoints: RouteWaypoint[];
  geometry: GeoJSON.LineString | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  steps: RouteStep[];
  status: RouteStatus;
  error: string | null;
}

// A user-saved route template: just the stops and travel mode, not a snapshot of geometry
// or an origin — reloading it always recomputes directions from wherever the user is now.
