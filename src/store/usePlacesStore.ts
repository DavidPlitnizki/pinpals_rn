import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place, PlaceNote } from '../models/types';

const SAMPLE_PLACES: Place[] = [
  {
    id: 'sample-1',
    name: 'Central Park',
    description: 'Iconic urban park in the heart of Manhattan.',
    coordinates: { latitude: 40.785091, longitude: -73.968285 },
    category: 'nature',
    rating: 5,
    createdAt: new Date('2024-01-15').toISOString(),
    isFavorite: true,
  },
  {
    id: 'sample-2',
    name: 'Blue Bottle Coffee',
    description: 'Specialty coffee shop with great pour-overs.',
    coordinates: { latitude: 40.7220, longitude: -73.9985 },
    category: 'coffee',
    rating: 4,
    createdAt: new Date('2024-02-10').toISOString(),
    isFavorite: false,
  },
  {
    id: 'sample-3',
    name: 'MoMA',
    description: 'Museum of Modern Art – world-class contemporary art collection.',
    coordinates: { latitude: 40.7614, longitude: -73.9776 },
    category: 'art',
    rating: 5,
    createdAt: new Date('2024-03-01').toISOString(),
    isFavorite: true,
  },
  {
    id: 'sample-4',
    name: 'Joe\'s Pizza',
    description: 'Classic New York slice since 1975.',
    coordinates: { latitude: 40.7306, longitude: -74.0021 },
    category: 'food',
    rating: 4,
    createdAt: new Date('2024-03-15').toISOString(),
    isFavorite: false,
  },
  {
    id: 'sample-5',
    name: 'Chelsea Piers',
    description: 'Sports & entertainment complex on the Hudson River.',
    coordinates: { latitude: 40.7465, longitude: -74.0081 },
    category: 'sports',
    rating: 4,
    createdAt: new Date('2024-04-01').toISOString(),
    isFavorite: false,
  },
  {
    id: 'sample-6',
    name: 'Devoción Coffee',
    description: 'Colombian coffee roaster in Williamsburg.',
    coordinates: { latitude: 40.7126, longitude: -73.9614 },
    category: 'coffee',
    rating: 5,
    createdAt: new Date('2024-04-20').toISOString(),
    isFavorite: true,
  },
  {
    id: 'sample-7',
    name: 'Brooklyn Botanic Garden',
    description: 'Beautiful gardens with cherry blossom esplanade.',
    coordinates: { latitude: 40.6694, longitude: -73.9624 },
    category: 'nature',
    rating: 5,
    createdAt: new Date('2024-05-05').toISOString(),
    isFavorite: true,
  },
  {
    id: 'sample-8',
    name: 'Tacombi',
    description: 'Mexican street food in a casual setting.',
    coordinates: { latitude: 40.7235, longitude: -73.9933 },
    category: 'food',
    rating: 3,
    createdAt: new Date('2024-05-20').toISOString(),
    isFavorite: false,
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface PlacesState {
  places: Place[];
  notes: PlaceNote[];

  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;
  toggleFavorite: (id: string) => void;

  addNote: (note: Omit<PlaceNote, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  getNotesForPlace: (placeId: string) => PlaceNote[];
}

export const usePlacesStore = create<PlacesState>()(
  persist(
    (set, get) => ({
      places: SAMPLE_PLACES,
      notes: [],

      addPlace: (placeData) => {
        const place: Place = {
          ...placeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ places: [...state.places, place] }));
      },

      updatePlace: (id, updates) => {
        set((state) => ({
          places: state.places.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deletePlace: (id) => {
        set((state) => ({
          places: state.places.filter((p) => p.id !== id),
          notes: state.notes.filter((n) => n.placeId !== id),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          places: state.places.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      addNote: (noteData) => {
        const note: PlaceNote = {
          ...noteData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notes: [...state.notes, note] }));
      },

      deleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      getNotesForPlace: (placeId) => {
        return get().notes.filter((n) => n.placeId === placeId);
      },
    }),
    {
      name: 'pinpals-places',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: () => ({ places: SAMPLE_PLACES, notes: [] }),
    }
  )
);
