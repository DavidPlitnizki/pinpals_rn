import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import {
  AttributionSource,
  logAttributionSource,
  logRateUsPrompted,
} from '../../../services/analytics';
import { requestStoreReview } from '../../../services/storeReview';
import { useOnboardingStore } from '../../../store/useOnboardingStore';

export function useAttributionScreen() {
  const router = useRouter();
  const completeAttribution = useOnboardingStore((state) => state.completeAttribution);

  // Whichever way this screen ends, goodwill from just having finished (or at least decided to
  // leave) the tour is the best moment this app gets to ask for a rating — so the system prompt
  // rides along regardless of what was picked above. It's fire-and-forget and non-blocking: if
  // iOS has already used up its yearly quota of these, this silently does nothing.
  const finish = useCallback(() => {
    completeAttribution();
    logRateUsPrompted('onboarding');
    void requestStoreReview();
    router.replace('/(tabs)/map');
  }, [completeAttribution, router]);

  const handleSelect = useCallback(
    (source: AttributionSource) => {
      logAttributionSource(source);
      finish();
    },
    [finish],
  );

  const handleSkip = useCallback(() => {
    logAttributionSource('skipped');
    finish();
  }, [finish]);

  return { handleSelect, handleSkip };
}
