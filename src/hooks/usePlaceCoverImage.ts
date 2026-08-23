import { useEffect, useRef, useState } from 'react';

import { Coordinates, Place, PlaceCategory } from '../models/types';
import { getMapboxStaticImageUrl } from '../services/mapboxStatic';
import { fetchWikipediaThumbnail } from '../services/wikipedia';

// Wikipedia articles only realistically exist for notable outdoor/cultural spots — gating the
// lookup to these categories avoids a wasted lookup for every café/restaurant card.
const LANDMARK_CATEGORIES: PlaceCategory[] = ['nature', 'art'];

// Module-level so the same place doesn't re-fetch its Wikipedia thumbnail every time its card
// remounts (e.g. scrolling a grid in and out of the FlatList's render window, or reselecting
// the same map pin). Doubles as the render-time source of truth, so the value survives a
// remount without any state to re-sync.
const wikiThumbnailCache = new Map<string, string | null>();

function cacheKey(coords: Coordinates): string {
  return `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
}

// Which of the fallbacks actually produced `uri`. Mapbox's terms require their Static Images
// API results to be credited "as you would cite a photograph" wherever they're shown, so
// callers need to know when the cover is a map crop rather than a real photo.
export type CoverImageSource = 'local' | 'wikipedia' | 'mapbox' | null;

export interface CoverImage {
  uri: string | null;
  // True only while the Wikipedia lookup is in flight — the caller shows a spinner instead of
  // a placeholder that would flip to a photo a moment later.
  loading: boolean;
  source: CoverImageSource;
}

// Cover image priority: a local photo (the caller's own resolved "best photo" for the point),
// then (when the point is landmark-ish) a Wikipedia lead image, then a Mapbox static map crop
// centered on it, then null (caller renders its own icon placeholder — e.g. no Mapbox token).
// Takes plain coordinates rather than a Place so an unsaved map selection (a basemap POI, a
// search result) gets the same cover art as a saved pin, without having to be saved first.
export function useCoverImage(
  coordinates: Coordinates,
  options?: { localPhotoUri?: string | null; wikipedia?: boolean },
): CoverImage {
  const localPhoto = options?.localPhotoUri ?? undefined;
  const wikipediaEnabled = options?.wikipedia ?? false;
  const key = cacheKey(coordinates);
  const { latitude, longitude } = coordinates;

  // The cache is what's actually read at render time; this counter only exists to schedule a
  // re-render once an in-flight lookup has filled it in.
  const [, bumpVersion] = useState(0);
  const requestedKeyRef = useRef<string | null>(null);
  const wantsLookup = !localPhoto && wikipediaEnabled;
  const isCached = wikiThumbnailCache.has(key);

  useEffect(() => {
    if (!wantsLookup || isCached) return;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      const result = await fetchWikipediaThumbnail({ latitude, longitude });
      wikiThumbnailCache.set(key, result);
      if (!cancelled) bumpVersion((n) => n + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [wantsLookup, isCached, key, latitude, longitude]);

  if (localPhoto) return { uri: localPhoto, loading: false, source: 'local' };
  if (wantsLookup && !isCached) return { uri: null, loading: true, source: null };

  const wikiPhoto = wikiThumbnailCache.get(key) ?? null;
  if (wikiPhoto) return { uri: wikiPhoto, loading: false, source: 'wikipedia' };

  const mapCrop = getMapboxStaticImageUrl({ latitude, longitude });
  return { uri: mapCrop, loading: false, source: mapCrop ? 'mapbox' : null };
}

// Place-shaped wrapper kept for the saved-place surfaces (cards, rows, pin callout).
export function usePlaceCoverImage(place: Place, localPhotoUri?: string | null): CoverImage {
  return useCoverImage(place.coordinates, {
    // The user's own photo wins; then whatever photo the map had for this spot when it was
    // saved; then the Wikipedia/map-crop fallbacks inside useCoverImage.
    localPhotoUri: localPhotoUri ?? place.mainPhotoUri ?? place.coverImageUrl,
    // No category set (the normal case) is treated as "might be notable" rather than
    // "definitely a café" — otherwise no saved place would ever get a Wikipedia cover.
    wikipedia: !place.category || LANDMARK_CATEGORIES.includes(place.category),
  });
}
