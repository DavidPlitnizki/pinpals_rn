import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// The tour is not a single linear walkthrough: its second step highlights a button that only
// exists once the user has actually long-pressed the map, which may be minutes later or in a
// later session. So progress is a persisted stage rather than copilot's own step cursor.
//
//   welcome         — freshly installed; the full-screen intro has not been shown yet. This is
//                     the only stage with its own screen rather than a hint over the map — the
//                     entry door, reached right after auth, before the tabs exist at all
//   map-tip         — the intro is done; the map hint has not been shown yet
//   save-tip        — the map hint is done; the next card that opens points at Save
//   memory-tip      — the place form: points at Add Memory, the thing the whole app is for
//                     and the one control on that form nobody finds
//   save-pin-tip    — the memory is written; point at the tick that commits the whole thing,
//                     because a form abandoned here loses the memory with it
//   remembrance-tip — the place is saved; show where it went, so the first memory is not the
//                     last thing the user ever sees of it
//   done            — through the whole tour, or out of it early. AttributionScreen follows
//                     right after, gated on `attributionCompleted` below rather than a stage
//                     of its own — the tour can be replayed (resetOnboarding), but that one-time
//                     question shouldn't reappear just because the tour did
export type OnboardingStage =
  'welcome' | 'map-tip' | 'save-tip' | 'memory-tip' | 'save-pin-tip' | 'remembrance-tip' | 'done';

interface OnboardingState {
  stage: OnboardingStage;
  // Set once persist has read AsyncStorage. Until then `stage` is still the default
  // 'welcome', and starting the tour on it would re-show the intro to someone who finished
  // it months ago, every cold start.
  hydrated: boolean;
  // Whether the "where did you hear about us" prompt (AttributionScreen) has been answered or
  // explicitly skipped. Deliberately separate from `stage`: resetOnboarding() rewinds the tour
  // for a replay, but that isn't a reason to ask this again — it's a one-time question about
  // how the person found the app, not part of the walkthrough itself.
  attributionCompleted: boolean;

  completeWelcome: () => void;
  completeMapTip: () => void;
  completeSaveTip: () => void;
  completeMemoryTip: () => void;
  completePlaceSaved: () => void;
  completeRemembranceTip: () => void;
  abandonPlaceForm: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  completeAttribution: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      stage: 'welcome',
      hydrated: false,
      attributionCompleted: false,

      completeWelcome: () =>
        set((state) => (state.stage === 'welcome' ? { stage: 'map-tip' } : state)),
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
      // Rewinds all the way to the welcome screen, not just to the map hint — replaying "the
      // tour" means the whole thing, starting where a fresh install would. Does not touch
      // attributionCompleted — see its own comment above.
      resetOnboarding: () => set({ stage: 'welcome' }),
      completeAttribution: () => set({ attributionCompleted: true }),
    }),
    {
      name: 'pinpals-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` is derived from persistence itself — writing it to storage would restore a
      // stale `true` before this run's rehydration has actually finished.
      partialize: (state) => ({
        stage: state.stage,
        attributionCompleted: state.attributionCompleted,
      }),
      // zustand's default merge is `{...currentState, ...persistedState}` — for any key the
      // persisted payload doesn't have (attributionCompleted, on storage written before that
      // field existed), that silently keeps whatever this process's in-memory state already
      // happened to hold, rather than the field's own declared default. Spelling out the
      // defaults here first, under the persisted values, makes rehydrate deterministic from
      // storage alone instead of depending on the store having started fresh beforehand.
      merge: (persistedState, currentState) => ({
        ...currentState,
        stage: 'welcome',
        attributionCompleted: false,
        ...(persistedState as Partial<OnboardingState>),
      }),
      onRehydrateStorage: () => () => {
        // stage/attributionCompleted are already correct by the time this runs — merge() above
        // ran first, as part of the same rehydrate call. This only has hydrated left to flip.
        useOnboardingStore.setState({ hydrated: true });
      },
    },
  ),
);
