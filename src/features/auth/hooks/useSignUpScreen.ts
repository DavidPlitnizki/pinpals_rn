import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';

export function useSignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Name is required.';
    if (!email.includes('@')) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleSignUp() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signUp(email, password, name.trim());
      // AuthGate handles redirect
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed. Please try again.');
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

  function goToLogin() {
    router.back();
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSignUp,
    handleGooglePress,
    handleApplePress,
    goToLogin,
  };
}
