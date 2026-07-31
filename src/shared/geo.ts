import { Coordinates } from '../models/types';

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

export function findNearestStepIndex(
  coords: Coordinates,
  steps: { maneuverLocation: Coordinates }[],
): number | null {
  if (steps.length === 0) return null;
  let bestIdx = 0;
  let bestDist = Infinity;
  steps.forEach((step, idx) => {
    const dist = haversineMeters(coords, step.maneuverLocation);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  });
  return bestIdx;
}
