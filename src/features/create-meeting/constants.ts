import { Coordinates } from "../../models/types";

export const DEFAULT_COORDS: Coordinates = {
  latitude: 40.785091,
  longitude: -73.968285,
};

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const MINUTES = [0, 15, 30, 45];
