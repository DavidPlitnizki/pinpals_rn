import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meeting } from '../models/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface MeetingsState {
  meetings: Meeting[];

  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  deleteMeeting: (id: string) => void;
}

export const useMeetingsStore = create<MeetingsState>()(
  persist(
    (set) => ({
      meetings: [],

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
    }),
    {
      name: 'pinpals-meetings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
