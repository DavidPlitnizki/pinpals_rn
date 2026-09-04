import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useOnboardingStore } from '../../../store/useOnboardingStore';

// The door into the tour, reached once — right after auth, before the tabs exist — and never
// again on its own (Profile's "Show the tour again" rewinds the stage and lands back here, but
// that is a deliberate replay, not this screen re-appearing on its own).
export function useWelcomeOnboardingScreen() {
  const router = useRouter();
  const completeWelcome = useOnboardingStore((state) => state.completeWelcome);
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);

  const handleStart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeWelcome();
    router.replace('/(tabs)/map');
  }, [completeWelcome, router]);

  const handleSkip = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Ends the whole tour, not just this screen — there is nowhere later to catch someone who
    // declined here, so this is the one chance to record "not interested".
    skipOnboarding();
    router.replace('/(tabs)/map');
  }, [skipOnboarding, router]);

  return { handleStart, handleSkip };
}
