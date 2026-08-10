import { useEffect, useRef, useState } from 'react';

import { Coordinates, Place, PlaceCategory } from '../models/types';
import { getMapboxStaticImageUrl } from '../services/mapboxStatic';
import { fetchWikipediaThumbnail } from '../services/wikipedia';

// Wikipedia articles only realistically exist for notable outdoor/cultural spots — gating the
// lookup to these categories avoids a wasted lookup for every café/restaurant card.
const LANDMARK_CATEGORIES: PlaceCategory[] = ['nature', 'art'];

// Module-level so the same place doesn't re-fetch its Wikipedia thumbnail every time its card
// remounts (e.g. scrolling a grid in and out of the FlatList's render window, or reselecting
// the same map pin).
const wikiThumbnailCache = new Map<string, string | null>();

function cacheKey(coords: Coordinates): string {
  return `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
}

// Cover image priority: a local photo (the caller's own resolved "best photo" for the place —
// defaults to its mainPhotoUri pick), then (for landmark-ish categories) a Wikipedia lead
// image, then a Mapbox static map crop centered on the pin, then null (caller renders its own
// category-icon placeholder — e.g. no Mapbox token configured).
export function usePlaceCoverImage(place: Place, localPhotoUri?: string | null): string | null {
  const localPhoto = localPhotoUri ?? place.mainPhotoUri;
  const isLandmarkish = LANDMARK_CATEGORIES.includes(place.category);
  const key = cacheKey(place.coordinates);
  const [wikiPhoto, setWikiPhoto] = useState<string | null>(
    () => wikiThumbnailCache.get(key) ?? null,
  );
  const requestedRef = useRef(false);

  useEffect(() => {
    if (localPhoto || !isLandmarkish) return;
    if (wikiThumbnailCache.has(key)) return;
    if (requestedRef.current) return;
    requestedRef.current = true;

    async function loadWikiThumbnail() {
      const result = await fetchWikipediaThumbnail(place.coordinates);
      wikiThumbnailCache.set(key, result);
      setWikiPhoto(result);
    }
    void loadWikiThumbnail();
  }, [localPhoto, isLandmarkish, key, place.coordinates]);

  if (localPhoto) return localPhoto;
  if (wikiPhoto) return wikiPhoto;
  return getMapboxStaticImageUrl(place.coordinates);
}
