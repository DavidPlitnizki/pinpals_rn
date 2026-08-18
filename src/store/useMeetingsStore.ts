import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meeting, MeetingStatus } from '../models/types';

interface MeetingsState {
  meetings: Meeting[];

  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  updateMeetingStatus: (id: string, status: MeetingStatus) => void;
}

export const useMeetingsStore = create<MeetingsState>()(
  persist(
    (set) => ({
      meetings: [],

      updateMeeting: (id, updates) => {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      deleteMeeting: (id) => {
        set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id) }));
      },

      updateMeetingStatus: (id, status) => {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === id ? { ...m, status } : m)),
        }));
      },
    }),
    {
      name: 'pinpals-meetings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { meetings?: Meeting[] };
        if (version < 2) {
          const meetings = (state.meetings || []).map((m) => ({
            ...m,
            status: m.status ?? 'draft',
            proposedPlaceIds: m.proposedPlaceIds ?? [],
            participants: m.participants ?? [],
          }));
          return { meetings };
        }
        return state;
      },
    },
  ),
);
