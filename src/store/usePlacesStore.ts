import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place, PlaceNote, MemoryMood } from '../models/types';

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
    tags: ['прогулка', 'природа'],
    visitCount: 3,
    lastVisited: new Date('2024-06-01').toISOString(),
  },
  {
    id: 'sample-2',
    name: 'Blue Bottle Coffee',
    description: 'Specialty coffee shop with great pour-overs.',
    coordinates: { latitude: 40.722, longitude: -73.9985 },
    category: 'coffee',
    rating: 4,
    createdAt: new Date('2024-02-10').toISOString(),
    isFavorite: false,
    tags: ['утром', 'тихое'],
    visitCount: 1,
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
    tags: ['искусство', 'вдохновение'],
    visitCount: 2,
    lastVisited: new Date('2024-05-15').toISOString(),
  },
  {
    id: 'sample-4',
    name: "Joe's Pizza",
    description: 'Classic New York slice since 1975.',
    coordinates: { latitude: 40.7306, longitude: -74.0021 },
    category: 'food',
    rating: 4,
    createdAt: new Date('2024-03-15').toISOString(),
    isFavorite: false,
    tags: ['быстро', 'вкусно'],
    visitCount: 1,
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
    tags: ['спорт', 'активный отдых'],
    visitCount: 1,
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
    tags: ['кофе', 'атмосфера'],
    visitCount: 4,
    lastVisited: new Date('2024-06-10').toISOString(),
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
    tags: ['сакура', 'фото', 'природа'],
    visitCount: 2,
    lastVisited: new Date('2024-05-10').toISOString(),
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
    tags: ['мексиканская', 'быстро'],
    visitCount: 1,
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface PlacesState {
  places: Place[];
  notes: PlaceNote[];

  addPlace: (place: Omit<Place, 'id' | 'createdAt' | 'tags' | 'visitCount'>) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;
  toggleFavorite: (id: string) => void;

  addNote: (note: Omit<PlaceNote, 'id' | 'createdAt'> & { createdAt?: string }) => void;
  deleteNote: (id: string) => void;
  getNotesForPlace: (placeId: string) => PlaceNote[];

  addTagToPlace: (placeId: string, tag: string) => void;
  removeTagFromPlace: (placeId: string, tag: string) => void;
  recordVisit: (placeId: string) => void;
  getLatestMoodForPlace: (placeId: string) => MemoryMood | undefined;
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
          tags: (placeData as Partial<Place>).tags ?? [],
          visitCount: (placeData as Partial<Place>).visitCount ?? 0,
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
          places: state.places.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)),
        }));
      },

      addNote: (noteData) => {
        const note: PlaceNote = {
          ...noteData,
          id: generateId(),
          createdAt: noteData.createdAt ?? new Date().toISOString(),
          companions: noteData.companions ?? [],
        };
        set((state) => ({ notes: [...state.notes, note] }));

        // Update place visitCount and lastVisited
        const place = get().places.find((p) => p.id === noteData.placeId);
        if (place) {
          set((state) => ({
            places: state.places.map((p) =>
              p.id === noteData.placeId
                ? {
                    ...p,
                    visitCount: (p.visitCount || 0) + 1,
                    lastVisited: new Date().toISOString(),
                  }
                : p,
            ),
          }));
        }
      },

      deleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      getNotesForPlace: (placeId) => {
        return get().notes.filter((n) => n.placeId === placeId);
      },

      addTagToPlace: (placeId, tag) => {
        set((state) => ({
          places: state.places.map((p) =>
            p.id === placeId && !(p.tags || []).includes(tag)
              ? { ...p, tags: [...(p.tags || []), tag] }
              : p,
          ),
        }));
      },

      removeTagFromPlace: (placeId, tag) => {
        set((state) => ({
          places: state.places.map((p) =>
            p.id === placeId ? { ...p, tags: (p.tags || []).filter((t) => t !== tag) } : p,
          ),
        }));
      },

      recordVisit: (placeId) => {
        set((state) => ({
          places: state.places.map((p) =>
            p.id === placeId
              ? { ...p, visitCount: (p.visitCount || 0) + 1, lastVisited: new Date().toISOString() }
              : p,
          ),
        }));
      },

      getLatestMoodForPlace: (placeId) => {
        const notes = get()
          .notes.filter((n) => n.placeId === placeId && n.mood)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return notes[0]?.mood;
      },
    }),
    {
      name: 'pinpals-places',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { places?: Place[]; notes?: PlaceNote[] };
        // Migrate v2 → v3: add new fields with defaults
        if (version < 3) {
          const places = (state.places || SAMPLE_PLACES).map((p) => ({
            ...p,
            tags: p.tags ?? [],
            visitCount: p.visitCount ?? 0,
          }));
          const notes = (state.notes || []).map((n) => ({
            ...n,
            companions: n.companions ?? [],
          }));
          return { places, notes };
        }
        return state;
      },
    },
  ),
);
