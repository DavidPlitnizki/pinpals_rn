import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';

export function useLoginScreen() {
  const { login, skipAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.includes('@')) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleLogin() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      // AuthGate handles redirect
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGooglePress() {
    Alert.alert('Coming soon', 'Social login is not available yet.');
  }

  function handleApplePress() {
    Alert.alert('Coming soon', 'Social login is not available yet.');
  }

  async function handleSkip() {
    await skipAuth();
    // AuthGate handles redirect
  }

  function goToSignUp() {
    router.push('/(auth)/sign-up' as any);
  }

  function goToResetPassword() {
    router.push('/(auth)/reset-password' as any);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleGooglePress,
    handleApplePress,
    handleSkip,
    goToSignUp,
    goToResetPassword,
  };
}
