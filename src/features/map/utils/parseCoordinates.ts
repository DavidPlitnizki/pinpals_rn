import { Coordinates } from '../../../models/types';

const COORDINATE_PAIR = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

// Accepts "lat, lng" (or "lat,lng") typed directly into the FlyTo search field — anything
// else (a city/country name) falls through to the Mapbox geocoder instead.
export function parseCoordinates(input: string): Coordinates | null {
  const match = COORDINATE_PAIR.exec(input);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude };
}
