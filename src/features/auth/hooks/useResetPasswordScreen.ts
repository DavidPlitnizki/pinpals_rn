import { useRouter } from "expo-router";
import { useState } from "react";

import { sendPasswordReset } from "../../../services/authService";

export function useResetPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendReset() {
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
    } catch {
      // Show success regardless — don't leak whether email exists
    } finally {
      setIsLoading(false);
      setIsSuccess(true);
    }
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
