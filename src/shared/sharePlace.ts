import { Share } from 'react-native';

import { Coordinates } from '../models/types';
import { logPlaceShared } from '../services/analytics';
import { buildGoogleMapsSearchUrl } from './mapLinks';

interface ShareSpotInput {
  name: string;
  coordinates: Coordinates;
  address?: string;
  // Optional local photo — iOS renders it inline in the share sheet; without one the maps
  // link itself is shared as the url.
  photoUri?: string;
}

// Shared by every "share this spot" affordance — saved places and the map-selected ones
// (native basemap POIs, search results) that were never saved. Nothing here needs a Place,
// so a spot the user only tapped on the map is shareable exactly like a saved one.
export function shareSpot({ name, coordinates, address, photoUri }: ShareSpotInput): void {
  const { latitude, longitude } = coordinates;
  const mapsUrl = buildGoogleMapsSearchUrl(coordinates);
  const lines = [name, address, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, mapsUrl];
  logPlaceShared();
  void Share.share({
    message: lines.filter(Boolean).join('\n'),
    url: photoUri ?? mapsUrl,
  });
}
