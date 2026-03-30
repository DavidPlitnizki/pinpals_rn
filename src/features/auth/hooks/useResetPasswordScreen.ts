import { useRouter } from 'expo-router';
import { useState } from 'react';

export function useResetPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendReset() {
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setIsLoading(true);
    // Mock: simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    setIsSuccess(true);
  }

  function goToLogin() {
    router.back();
  }

  return {
    email,
    setEmail,
    isLoading,
    isSuccess,
    error,
    handleSendReset,
    goToLogin,
  };
}
