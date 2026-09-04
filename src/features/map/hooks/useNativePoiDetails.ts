import { useEffect, useState } from 'react';

import { Coordinates } from '../../../models/types';
import { reverseGeocodeAddress, searchMapboxPlaces } from '../../../services/mapboxSearch';
import { haversineMeters } from '../../../shared/geo';

export interface NativePoiDetails {
  address?: string;
  phone?: string;
  website?: string;
}

// How close a search hit must be to the tapped POI to count as the same place. Basemap POI
// coordinates and Search Box coordinates for one venue differ by a few tens of metres at
// most; anything further is a different business that merely shares the name.
const SAME_PLACE_THRESHOLD_M = 120;

// Module-level so re-tapping the same POI (or reopening its callout) doesn't re-query.
const detailsCache = new Map<string, NativePoiDetails>();
// Stable reference so a callout without details yet doesn't get a new object every render.
const EMPTY_DETAILS: NativePoiDetails = {};

// A basemap POI carries only a name and a category — no address, phone or website. This looks
// the venue up in Mapbox Search by name near its own coordinates to fill those in, falling
// back to a plain reverse-geocode for the address when no matching venue is found.
export function useNativePoiDetails(
  id: string | undefined,
  name: string | undefined,
  coordinates: Coordinates | undefined,
  // Skips both lookups. A long-pressed point arrives with its address already resolved, and
  // searching Mapbox for a name like "Dropped pin" would be a billed request for nothing.
  known?: NativePoiDetails,
): NativePoiDetails {
  // The cache is the render-time source of truth; this counter only schedules a re-render
  // once an in-flight lookup has filled it in (setting state directly in the effect would
  // fight the cache and add a render pass).
  const [, bumpVersion] = useState(0);

  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const cached = id ? detailsCache.get(id) : undefined;

  useEffect(() => {
    if (known) return;
    if (!id || !name || latitude === undefined || longitude === undefined) return;
    if (detailsCache.has(id)) return;

    let cancelled = false;
    const coords = { latitude, longitude };

    void (async () => {
      let resolved: NativePoiDetails = {};
      try {
        const results = await searchMapboxPlaces(name, coords, { limit: 5 });
        const match = results.find(
          (r) => haversineMeters(coords, r.coordinates) <= SAME_PLACE_THRESHOLD_M,
        );
        if (match) {
          resolved = { address: match.fullAddress, phone: match.phone, website: match.website };
        }
      } catch {
        // Falls through to the reverse-geocode below — a failed enrich shouldn't leave the
        // callout with nothing at all.
      }

      if (!resolved.address) {
        const address = await reverseGeocodeAddress(coords);
        if (address) resolved = { ...resolved, address };
      }

      detailsCache.set(id, resolved);
      if (!cancelled) bumpVersion((n) => n + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [known, id, name, latitude, longitude]);

  return known ?? cached ?? EMPTY_DETAILS;
}
