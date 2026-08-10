import { Coordinates } from '../models/types';

const STATIC_IMAGES_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';

// Deterministic cover fallback when a place has no user photo and no Wikipedia hit — a small
// static map crop centered on the pin. No network call needed here: this is just a URL, the
// <Image> component does the actual fetch. Reuses the same Mapbox token/account as the rest of
// the app, so no new vendor or free-tier limit to track.
export function getMapboxStaticImageUrl(
  coords: Coordinates,
  options?: { width?: number; height?: number; zoom?: number },
): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const width = options?.width ?? 400;
  const height = options?.height ?? 240;
  const zoom = options?.zoom ?? 15;
  const marker = `pin-s+4A7C59(${coords.longitude},${coords.latitude})`;

  return `${STATIC_IMAGES_URL}/${marker}/${coords.longitude},${coords.latitude},${zoom}/${width}x${height}@2x?access_token=${token}`;
}
