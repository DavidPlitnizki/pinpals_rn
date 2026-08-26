import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

export type MapStyleId = 'streets' | 'outdoors' | 'satellite' | 'light' | 'dark';

export interface MapStyleOption {
  id: MapStyleId;
  label: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  url: string;
}

// Written out rather than taken from Mapbox.StyleURL: that enum still points at v11-era
// styles, while these are the current versions — and streets-v12 is what the static map
// covers in usePlaceCoverImage already use, so a saved place's cover matches the live map.
export const MAP_STYLES: MapStyleOption[] = [
  {
    id: 'streets',
    label: 'Streets',
    description: 'The default map, with street names and places',
    icon: 'map-outline',
    url: 'mapbox://styles/mapbox/streets-v12',
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    description: 'Terrain, trails, and contour lines',
    icon: 'trail-sign-outline',
    url: 'mapbox://styles/mapbox/outdoors-v12',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    description: 'Aerial imagery with street names on top',
    icon: 'earth-outline',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Muted, so your pins carry the colour',
    icon: 'sunny-outline',
    url: 'mapbox://styles/mapbox/light-v11',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'The same, on a dark ground',
    icon: 'moon-outline',
    url: 'mapbox://styles/mapbox/dark-v11',
  },
];

export const DEFAULT_MAP_STYLE: MapStyleId = 'streets';

export function mapStyleUrl(id: MapStyleId): string {
  return (MAP_STYLES.find((style) => style.id === id) ?? MAP_STYLES[0]).url;
}
