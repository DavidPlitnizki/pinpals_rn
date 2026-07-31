import { Coordinates } from '../models/types';

export interface MapboxSearchResult {
  id: string;
  name: string;
  fullAddress?: string;
  imageUrl?: string;
  category?: string;
  maki?: string;
  website?: string;
  coordinates: Coordinates;
}

export interface MapboxSearchOptions {
  bbox?: [number, number, number, number];
}

const SEARCH_BOX_FORWARD_URL = 'https://api.mapbox.com/search/searchbox/v1/forward';

interface MapboxFeature {
  id?: string;
  geometry: { coordinates: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    poi_category?: string[];
    maki?: string;
    metadata?: {
      photos?: { original?: string; url?: string }[];
      website?: string;
    };
  };
}

function extractImageUrl(feature: MapboxFeature): string | undefined {
  return (
    feature.properties?.metadata?.photos?.[0]?.original ??
    feature.properties?.metadata?.photos?.[0]?.url
  );
}

function formatCategory(feature: MapboxFeature): string | undefined {
  const raw = feature.properties?.poi_category?.[0];
  if (!raw) return undefined;
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function searchMapboxPlaces(
  query: string,
  proximity: Coordinates | null,
  options?: MapboxSearchOptions,
): Promise<MapboxSearchResult[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const trimmed = query.trim();
  if (!token || !trimmed) return [];

  const params = new URLSearchParams({
    q: trimmed,
    types: 'poi,address,place',
    limit: '5',
    access_token: token,
  });
  if (proximity) {
    params.set('proximity', `${proximity.longitude},${proximity.latitude}`);
  }
  if (options?.bbox) {
    params.set('bbox', options.bbox.join(','));
  }

  const url = `${SEARCH_BOX_FORWARD_URL}?${params.toString()}`;
  console.log('[mapboxSearch] request →', url.replace(token, '***'));

  const response = await fetch(url);
  if (!response.ok) {
    console.log('[mapboxSearch] response ← error', response.status, await response.text());
    throw new Error(`Mapbox search failed: ${response.status}`);
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  console.log('[mapboxSearch] response ←', JSON.stringify(data, null, 2));

  return (data.features ?? []).map((feature) => ({
    id: feature.properties?.mapbox_id ?? feature.id ?? feature.geometry.coordinates.join(','),
    name: feature.properties?.name ?? feature.properties?.full_address ?? trimmed,
    fullAddress: feature.properties?.full_address ?? feature.properties?.place_formatted,
    imageUrl: extractImageUrl(feature),
    category: formatCategory(feature),
    maki: feature.properties?.maki,
    website: feature.properties?.metadata?.website,
    coordinates: {
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    },
  }));
}
