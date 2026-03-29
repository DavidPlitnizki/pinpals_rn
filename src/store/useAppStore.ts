import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place, PlaceNote, Meeting, UserProfile, PlaceCategory } from '../models/types';

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
];

interface AppState {
  places: Place[];
  notes: PlaceNote[];
  meetings: Meeting[];
  profile: UserProfile;

  // Place actions
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Note actions
  addNote: (note: Omit<PlaceNote, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  getNotesForPlace: (placeId: string) => PlaceNote[];

  // Meeting actions
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  deleteMeeting: (id: string) => void;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      places: SAMPLE_PLACES,
      notes: [],
      meetings: [],
      profile: {
        id: '1',
        name: 'User',
        bio: '',
      },

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

      addMeeting: (meetingData) => {
        const meeting: Meeting = {
          ...meetingData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ meetings: [...state.meetings, meeting] }));
      },

      deleteMeeting: (id) => {
        set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id) }));
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: 'pinpals-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
