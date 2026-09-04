import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// The tour is not a single linear walkthrough: its second step highlights a button that only
// exists once the user has actually long-pressed the map, which may be minutes later or in a
// later session. So progress is a persisted stage rather than copilot's own step cursor.
//
//   map-tip         — freshly installed; the map hint has not been shown yet
//   save-tip        — the map hint is done; the next card that opens points at Save
//   memory-tip      — the place form: points at Add Memory, the thing the whole app is for
//                     and the one control on that form nobody finds
//   save-pin-tip    — the memory is written; point at the tick that commits the whole thing,
//                     because a form abandoned here loses the memory with it
//   remembrance-tip — the place is saved; show where it went, so the first memory is not the
//                     last thing the user ever sees of it
//   done            — through the whole tour, or out of it early
export type OnboardingStage =
  'map-tip' | 'save-tip' | 'memory-tip' | 'save-pin-tip' | 'remembrance-tip' | 'done';

interface OnboardingState {
  stage: OnboardingStage;
  // Set once persist has read AsyncStorage. Until then `stage` is still the default
  // 'map-tip', and starting the tour on it would re-show the hint to someone who finished
  // it months ago, every cold start.
  hydrated: boolean;

  completeMapTip: () => void;
  completeSaveTip: () => void;
  completeMemoryTip: () => void;
  completePlaceSaved: () => void;
  completeRemembranceTip: () => void;
  abandonPlaceForm: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      stage: 'map-tip',
      hydrated: false,

      completeMapTip: () =>
        set((state) => (state.stage === 'map-tip' ? { stage: 'save-tip' } : state)),
      completeSaveTip: () =>
        set((state) => (state.stage === 'save-tip' ? { stage: 'memory-tip' } : state)),
      completeMemoryTip: () =>
        set((state) => (state.stage === 'memory-tip' ? { stage: 'save-pin-tip' } : state)),

      // The place is committed, from whichever of the two form hints was showing — a user who
      // finds the tick before writing a memory has still found the tick.
      completePlaceSaved: () =>
        set((state) =>
          state.stage === 'memory-tip' || state.stage === 'save-pin-tip'
            ? { stage: 'remembrance-tip' }
            : state,
        ),

      completeRemembranceTip: () =>
        set((state) => (state.stage === 'remembrance-tip' ? { stage: 'done' } : state)),

      // The form was closed without saving: there is no place, so there is nothing for the
      // last hint to point the user at. Ends the tour rather than leaving it mid-sentence.
      abandonPlaceForm: () =>
        set((state) =>
          state.stage === 'memory-tip' || state.stage === 'save-pin-tip'
            ? { stage: 'done' }
            : state,
        ),
      skipOnboarding: () => set({ stage: 'done' }),
      resetOnboarding: () => set({ stage: 'map-tip' }),
    }),
    {
      name: 'pinpals-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` is derived from persistence itself — writing it to storage would restore a
      // stale `true` before this run's rehydration has actually finished.
      partialize: (state) => ({ stage: state.stage }),
      onRehydrateStorage: () => (state) => {
        useOnboardingStore.setState({ stage: state?.stage ?? 'map-tip', hydrated: true });
      },
    },
  ),
);
