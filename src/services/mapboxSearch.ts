import { Coordinates } from '../models/types';
import { reportNetworkError } from './crashReporting';

export interface MapboxSearchResult {
  id: string;
  name: string;
  fullAddress?: string;
  imageUrl?: string;
  category?: string;
  maki?: string;
  website?: string;
  phone?: string;
  coordinates: Coordinates;
}

export interface MapboxSearchOptions {
  bbox?: [number, number, number, number];
  // IETF tag (e.g. 'he', 'ru'). Mapbox matches names in the requested language, which is
  // what makes a query written in a non-Latin script resolve to the right place instead of
  // whatever transliteration happens to score highest.
  language?: string;
  limit?: number;
}

// Mapbox defaults to English matching; a query written in Hebrew/Cyrillic/Arabic/Greek needs
// its own language tag or it lands on an unrelated place with a similar-looking Latin name.
const SCRIPT_LANGUAGES: [RegExp, string][] = [
  [/[\u0590-\u05FF]/, 'he'],
  [/[\u0600-\u06FF]/, 'ar'],
  [/[\u0400-\u04FF]/, 'ru'],
  [/[\u0370-\u03FF]/, 'el'],
];

export function detectQueryLanguage(query: string): string | undefined {
  return SCRIPT_LANGUAGES.find(([pattern]) => pattern.test(query))?.[1];
}

const SEARCH_BOX_FORWARD_URL = 'https://api.mapbox.com/search/searchbox/v1/forward';
const GEOCODE_REVERSE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';

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
      phone?: string;
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

// Mapbox sometimes returns a third-party listing/aggregator page (Yelp, TripAdvisor, Google
// Maps, social profiles) as `metadata.website` instead of the place's own site — filter those out.
const THIRD_PARTY_WEBSITE_HOSTS = [
  'yelp.',
  'tripadvisor.',
  'facebook.com',
  'instagram.com',
  'foursquare.com',
  'google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'zomato.com',
  'opentable.com',
  'ubereats.com',
  'doordash.com',
  'grubhub.com',
  'linktr.ee',
];

function getOwnWebsite(feature: MapboxFeature): string | undefined {
  const website = feature.properties?.metadata?.website;
  if (!website) return undefined;
  try {
    const host = new URL(website).hostname.replace(/^www\./, '');
    if (THIRD_PARTY_WEBSITE_HOSTS.some((blocked) => host.includes(blocked))) return undefined;
    return website;
  } catch {
    return undefined;
  }
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
    // Mapbox's Search Box forward endpoint caps this at 10 — there's no "unlimited" option.
    limit: String(Math.min(options?.limit ?? 10, 10)),
    access_token: token,
  });
  const language = options?.language ?? detectQueryLanguage(trimmed);
  if (language) {
    params.set('language', language);
  }
  if (proximity) {
    params.set('proximity', `${proximity.longitude},${proximity.latitude}`);
  }
  if (options?.bbox) {
    params.set('bbox', options.bbox.join(','));
  }

  const url = `${SEARCH_BOX_FORWARD_URL}?${params.toString()}`;
  console.log('[mapboxSearch] request →', url.replace(token, '***'));

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    reportNetworkError('mapboxSearch', err, 'forward search request failed');
    throw err;
  }
  if (!response.ok) {
    const body = await response.text();
    console.log('[mapboxSearch] response ← error', response.status, body);
    const httpError = new Error(`Mapbox search failed: ${response.status}`);
    reportNetworkError('mapboxSearch', httpError, `forward search returned ${response.status}: ${body}`);
    throw httpError;
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
    website: getOwnWebsite(feature),
    phone: feature.properties?.metadata?.phone,
    coordinates: {
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    },
  }));
}

// Street address for a raw coordinate — used when a place is saved from a point that carried
// no address of its own (a long-press on the map, a route waypoint), so its card still shows
// where it is rather than just a pair of numbers.
export async function reverseGeocodeAddress(coords: Coordinates): Promise<string | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const params = new URLSearchParams({
    longitude: String(coords.longitude),
    latitude: String(coords.latitude),
    types: 'address',
    access_token: token,
  });

  try {
    const response = await fetch(`${GEOCODE_REVERSE_URL}?${params.toString()}`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      features?: { properties?: { full_address?: string; name?: string } }[];
    };
    const properties = data.features?.[0]?.properties;
    return properties?.full_address ?? properties?.name ?? null;
  } catch (err) {
    reportNetworkError('mapboxSearch', err, 'reverse address request failed');
    return null;
  }
}

// City/country for a raw coordinate — the weather screen's default location label (before the
// user searches somewhere else), naming wherever the map camera was pointed. Reuses the same
// Mapbox token/account as forward search, no separate vendor.
export async function reverseGeocodePlace(coords: Coordinates): Promise<string | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  // place first, then region/country as fallbacks — a coordinate in open country has no
  // "place" feature, and naming the region still beats showing nothing.
  const params = new URLSearchParams({
    longitude: String(coords.longitude),
    latitude: String(coords.latitude),
    types: 'place,region,country',
    access_token: token,
  });

  const url = `${GEOCODE_REVERSE_URL}?${params.toString()}`;
  console.log('[mapboxSearch] reverse request →', url.replace(token, '***'));

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[mapboxSearch] reverse response ← error', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      features?: {
        properties?: { name?: string; context?: { country?: { name?: string } } };
      }[];
    };
    console.log('[mapboxSearch] reverse response ←', JSON.stringify(data));

    const feature = data.features?.[0];
    const city = feature?.properties?.name;
    const country = feature?.properties?.context?.country?.name;
    if (!city && !country) return null;
    return [city, country].filter(Boolean).join(', ');
  } catch (err) {
    reportNetworkError('mapboxSearch', err, 'reverse geocode request failed');
    return null;
  }
}
