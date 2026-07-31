import { Coordinates } from '../models/types';
import { RouteProfile, RouteStep } from '../features/map/types';

export interface DirectionsResult {
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
}

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox';

interface MapboxStep {
  distance: number;
  maneuver: { instruction: string; location: [number, number] };
}

interface MapboxLeg {
  steps: MapboxStep[];
}

interface MapboxRoute {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  legs?: MapboxLeg[];
}

export async function getDirections(
  origin: Coordinates,
  destination: Coordinates,
  profile: RouteProfile,
  signal?: AbortSignal,
): Promise<DirectionsResult> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    access_token: token ?? '',
  });

  const url = `${DIRECTIONS_URL}/${profile}/${coords}?${params.toString()}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Mapbox directions failed: ${response.status}`);
  }

  const data = (await response.json()) as { routes?: MapboxRoute[] };
  const route = data.routes?.[0];
  if (!route) {
    throw new Error('No route found');
  }

  const steps: RouteStep[] = (route.legs?.[0]?.steps ?? []).map((step) => ({
    instruction: step.maneuver.instruction,
    distanceMeters: step.distance,
    maneuverLocation: { longitude: step.maneuver.location[0], latitude: step.maneuver.location[1] },
  }));

  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps,
  };
}
