import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/types';
import { downloadAvatarToAppStorage } from '../shared/photoStorage';

// The placeholder a profile starts with, and the marker for "the user never set a name" —
// adoptProviderProfile only fills in a provider's name while this is still what's stored.
export const DEFAULT_PROFILE_NAME = 'User';

interface ProfileState {
  profile: UserProfile;

  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: {
        id: '1',
        name: DEFAULT_PROFILE_NAME,
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

// Fills the profile in from whatever Google or Apple gave us at sign-in — but only where the
// user hasn't decided for themselves. A name they typed or an avatar they picked always wins;
// this never overwrites either.
//
// Waits for rehydration first. persist restores from AsyncStorage asynchronously, and
// onAuthStateChanged usually fires before that lands: writing early means reading the default
// profile (so "name is untouched" looks true for someone who renamed themselves months ago),
// and then having the write replaced by the restored state a moment later.
export async function adoptProviderProfile(update: {
  name?: string | null;
  photoURL?: string | null;
}): Promise<void> {
  if (!useProfileStore.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const unsubscribe = useProfileStore.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    });
  }

  const { profile, updateProfile } = useProfileStore.getState();
  const patch: Partial<UserProfile> = {};

  const name = update.name?.trim();
  if (name && profile.name === DEFAULT_PROFILE_NAME) patch.name = name;
  if (update.photoURL && !profile.avatarUri && !profile.avatarPreset) {
    // Stored as a local copy, not as the provider's URL — see downloadAvatarToAppStorage.
    patch.avatarUri = await downloadAvatarToAppStorage(update.photoURL);
  }

  if (Object.keys(patch).length > 0) updateProfile(patch);
}
