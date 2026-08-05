import { Coordinates } from '../models/types';
import { RouteProfile } from '../features/map/types';

// Centralized here rather than in `.env`: this is a public, stable URL scheme (not a secret
// or something that varies per build environment), so a typed constant is more appropriate
// than environment-variable indirection.
const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps';

export function buildGoogleMapsSearchUrl(coordinates: Coordinates): string {
  const params = new URLSearchParams({
    api: '1',
    query: `${coordinates.latitude},${coordinates.longitude}`,
  });
  return `${GOOGLE_MAPS_BASE_URL}/search/?${params.toString()}`;
}

export function buildGoogleMapsDirectionsUrl(
  origin: Coordinates,
  destination: Coordinates,
  waypoints: Coordinates[],
  profile: RouteProfile,
): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: profile === 'cycling' ? 'bicycling' : profile,
  });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((w) => `${w.latitude},${w.longitude}`).join('|'));
  }
  return `${GOOGLE_MAPS_BASE_URL}/dir/?${params.toString()}`;
}
