export type PlaceCategory = 'food' | 'nature' | 'art' | 'sports' | 'coffee';

export type MemoryMood =
  | 'calm'
  | 'happy'
  | 'nostalgic'
  | 'excited'
  | 'peaceful'
  | 'melancholic'
  | 'adventurous'
  | 'inLove';

export const MOOD_CONFIG: Record<MemoryMood, { emoji: string; color: string; label: string }> = {
  calm: { emoji: '😌', color: '#7EB8DA', label: 'Calm' },
  happy: { emoji: '😊', color: '#FFD166', label: 'Happy' },
  nostalgic: { emoji: '🥹', color: '#C4A8D1', label: 'Nostalgic' },
  excited: { emoji: '🤩', color: '#FF6B6B', label: 'Excited' },
  peaceful: { emoji: '🧘', color: '#A8D8B9', label: 'Peaceful' },
  melancholic: { emoji: '🌧️', color: '#8B9DAF', label: 'Melancholic' },
  adventurous: { emoji: '🚀', color: '#E8834A', label: 'Adventurous' },
  inLove: { emoji: '😍', color: '#F27DA5', label: 'In Love' },
};

export const MEMORY_MOODS: MemoryMood[] = [
  'calm',
  'happy',
  'nostalgic',
  'excited',
  'peaceful',
  'melancholic',
  'adventurous',
  'inLove',
];

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  coordinates: Coordinates;
  // Optional: nothing in the app asks the user for a category, so a place simply has none
  // unless one was set explicitly. Surfaces fall back to mood/pinColor instead.
  category?: PlaceCategory;
  rating: number; // 1-5 (legacy, kept for compatibility)
  createdAt: string; // ISO date
  isFavorite: boolean; // "Want to visit" in the UI
  favorite: boolean; // true favorite/starred place, distinct from "want to visit" above
  pinColor?: string; // user-chosen map pin color; falls back to Colors.myPlace when unset
  mainPhotoUri?: string; // user-picked "main" photo (long-press in the gallery) shown on the map pin
  address?: string; // captured from the search result at add-time, when available
  phone?: string;
  website?: string;
  tags: string[];
  visitCount: number;
  lastVisited?: string; // ISO date
}

export interface PlaceNote {
  id: string;
  placeId: string;
  text: string;
  photoUri?: string;
  photoUris?: string[]; // multiple photos
  createdAt: string;
  mood?: MemoryMood;
  companions: string[];
  colorTag?: string; // mood-derived color for map pin
}

export type MeetingStatus = 'draft' | 'proposed' | 'confirmed' | 'done';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  coordinates: Coordinates;
  address?: string;
  date: string; // ISO date
  placeId?: string;
  createdAt: string;
  status: MeetingStatus;
  proposedPlaceIds: string[];
  participants: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUri?: string;
  // Id into AVATAR_PRESETS (src/shared/avatarPresets.ts) — mutually exclusive with
  // avatarUri; picking one clears the other.
  avatarPreset?: string;
}
