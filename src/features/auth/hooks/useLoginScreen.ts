import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';

export function useLoginScreen() {
  const { signInWithGoogle, signInWithApple, skipAuth } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGooglePress() {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // AuthGate handles redirect
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplePress() {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithApple();
      // AuthGate handles redirect
    } catch (e: any) {
      setError(e?.message ?? 'Apple sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setIsLoading(true);
    try {
      await skipAuth();
      // AuthGate handles redirect
    } catch (e: any) {
      setError(e?.message ?? 'Couldn’t continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const goToTerms = useCallback(() => router.push('/legal?type=terms' as any), [router]);
  const goToPrivacy = useCallback(() => router.push('/legal?type=privacy' as any), [router]);

  return {
    isLoading,
    error,
    handleGooglePress,
    handleApplePress,
    handleSkip,
    goToTerms,
    goToPrivacy,
  };
}
