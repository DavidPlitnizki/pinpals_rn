import { Coordinates, PlaceCategory } from "../../models/types";

export interface AddPlaceState {
  name: string;
  category: PlaceCategory;
  rating: number;
  description: string;
  coordinates: Coordinates | null;
}
