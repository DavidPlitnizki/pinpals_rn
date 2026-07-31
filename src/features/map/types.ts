import { Coordinates, MemoryMood, PlaceCategory } from '../../models/types';

export interface AddPlaceState {
  name: string;
  category: PlaceCategory;
  rating: number;
  description: string;
  coordinates: Coordinates | null;
}

export interface QuickAddPlaceState {
  name: string;
  rating: number;
  description: string;
  photoUris: string[];
  mood?: MemoryMood;
  coordinates: Coordinates | null;
  createdAt: string;
}

export interface PendingSearchMarker {
  id: string;
  name: string;
  fullAddress?: string;
  imageUrl?: string;
  category?: string;
  maki?: string;
  website?: string;
  coordinates: Coordinates;
}
