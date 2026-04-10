import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/types';

interface ProfileState {
  profile: UserProfile;

  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: {
        id: '1',
        name: 'User',
        bio: '',
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: 'pinpals-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
