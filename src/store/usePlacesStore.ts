import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place, PlaceNote, MemoryMood } from '../models/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface PlacesState {
  places: Place[];
  notes: PlaceNote[];

  addPlace: (place: Omit<Place, 'id' | 'createdAt' | 'tags' | 'visitCount'>) => string;
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
      places: [],
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
        return place.id;
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
          const places = (state.places || []).map((p) => ({
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
