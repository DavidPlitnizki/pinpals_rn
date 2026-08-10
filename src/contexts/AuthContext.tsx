import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  AuthData,
  loginAnonymously,
  onAuthStateChanged,
  logout as serviceLogout,
  signInWithGoogle as serviceSignInWithGoogle,
  signInWithApple as serviceSignInWithApple,
  deleteAccount as serviceDeleteAccount,
} from '../services/authService';

interface AuthContextValue {
  isAuth: boolean;
  isGuest: boolean;
  isLoading: boolean;
  authData: AuthData | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  skipAuth: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setAuthData({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
          providerId: firebaseUser.isAnonymous
            ? 'anonymous'
            : ((firebaseUser.providerData[0]?.providerId as AuthData['providerId'] | undefined) ??
              'google.com'),
        });
        setIsAuth(!firebaseUser.isAnonymous);
        setIsGuest(firebaseUser.isAnonymous);
      } else {
        setAuthData(null);
        setIsAuth(false);
        setIsGuest(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await serviceSignInWithGoogle();
  }, []);

  const signInWithApple = useCallback(async () => {
    await serviceSignInWithApple();
  }, []);

  const logout = useCallback(async () => {
    await serviceLogout();
  }, []);

  const skipAuth = useCallback(async () => {
    await loginAnonymously();
  }, []);

  const deleteAccount = useCallback(async () => {
    await serviceDeleteAccount();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        isGuest,
        isLoading,
        authData,
        signInWithGoogle,
        signInWithApple,
        logout,
        skipAuth,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
