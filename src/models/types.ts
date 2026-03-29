export type PlaceCategory = 'food' | 'nature' | 'art' | 'sports' | 'coffee';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  coordinates: Coordinates;
  category: PlaceCategory;
  rating: number; // 1-5
  createdAt: string; // ISO date
  isFavorite: boolean;
}

export interface PlaceNote {
  id: string;
  placeId: string;
  text: string;
  photoUri?: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  coordinates: Coordinates;
  address?: string;
  date: string; // ISO date
  placeId?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUri?: string;
  bio?: string;
}
