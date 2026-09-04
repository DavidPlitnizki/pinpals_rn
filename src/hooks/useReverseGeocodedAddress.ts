import { useEffect, useRef, useState } from 'react';

import { Coordinates } from '../models/types';
import { reverseGeocodeAddress } from '../services/mapboxSearch';

// Same shape as the cover-image cache: module-level so reopening the sheet on the same point
// doesn't re-hit the geocoder, and so the value is readable at render time without any state
// to keep in sync.
const addressCache = new Map<string, string | null>();

function cacheKey(coords: Coordinates): string {
  return `${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
}

// Fills the cache from a lookup someone else already did — the long press that opens the POI
// card reverse-geocodes the point on its way there, and without this the quick-add sheet it
// leads to would buy the very same answer from Mapbox a second time, seconds later.
// `null` is a real answer here: "asked, and there is no address at this point".
export function primeReverseGeocodedAddress(coords: Coordinates, address: string | null): void {
  addressCache.set(cacheKey(coords), address);
}

// Street address for a bare map point. A POI or search result already carries one, so callers
// pass what they have as `known` and this only looks up the gap — a long-pressed spot on a
// street, where coordinates alone tell the user nothing about where they tapped.
export function useReverseGeocodedAddress(
  coordinates: Coordinates | null,
  known?: string,
): string | undefined {
  const key = coordinates ? cacheKey(coordinates) : null;
  const wantsLookup = !known && key !== null;

  // The cache is the render-time source of truth; this counter only schedules the re-render
  // once an in-flight lookup fills it in.
  const [, bumpVersion] = useState(0);
  const requestedKeyRef = useRef<string | null>(null);
  const isCached = key !== null && addressCache.has(key);

  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;

  useEffect(() => {
    if (!wantsLookup || isCached || key === null) return;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      const result = await reverseGeocodeAddress({ latitude: latitude!, longitude: longitude! });
      addressCache.set(key, result);
      if (!cancelled) bumpVersion((n) => n + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [wantsLookup, isCached, key, latitude, longitude]);

  if (known) return known;
  if (key === null) return undefined;
  return addressCache.get(key) ?? undefined;
}
