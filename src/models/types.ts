export type PlaceCategory = 'food' | 'nature' | 'art' | 'sports' | 'coffee';

export type MemoryMood =
  | 'calm'
  | 'happy'
  | 'nostalgic'
  | 'excited'
  | 'peaceful'
  | 'melancholic'
  | 'adventurous';

export const MOOD_CONFIG: Record<MemoryMood, { emoji: string; color: string; label: string }> = {
  calm: { emoji: '😌', color: '#7EB8DA', label: 'Спокойствие' },
  happy: { emoji: '😊', color: '#FFD166', label: 'Радость' },
  nostalgic: { emoji: '🥹', color: '#C4A8D1', label: 'Ностальгия' },
  excited: { emoji: '🤩', color: '#FF6B6B', label: 'Восторг' },
  peaceful: { emoji: '🧘', color: '#A8D8B9', label: 'Умиротворение' },
  melancholic: { emoji: '🌧️', color: '#8B9DAF', label: 'Меланхолия' },
  adventurous: { emoji: '🚀', color: '#E8834A', label: 'Приключение' },
};

export const MEMORY_MOODS: MemoryMood[] = [
  'calm',
  'happy',
  'nostalgic',
  'excited',
  'peaceful',
  'melancholic',
  'adventurous',
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
  category: PlaceCategory;
  rating: number; // 1-5 (legacy, kept for compatibility)
  createdAt: string; // ISO date
  isFavorite: boolean;
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
  bio?: string;
}
