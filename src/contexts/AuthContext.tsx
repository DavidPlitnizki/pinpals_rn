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
import { setAnalyticsUserId, setAnalyticsUserProperty } from '../services/analytics';
import { setCrashReportingUserContext, setCrashReportingUserId } from '../services/crashReporting';
import { useProfileStore } from '../store/useProfileStore';

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
        const providerId: AuthData['providerId'] = firebaseUser.isAnonymous
          ? 'anonymous'
          : ((firebaseUser.providerData[0]?.providerId as AuthData['providerId'] | undefined) ??
            'google.com');
        setAuthData({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          providerId,
        });
        setIsAuth(!firebaseUser.isAnonymous);
        setIsGuest(firebaseUser.isAnonymous);
        // Ties analytics events to a stable per-user id (not per-install) so returning-user
        // and retention reports hold up across reinstalls/devices for the same account.
        setAnalyticsUserId(firebaseUser.uid);
        setAnalyticsUserProperty('auth_provider', providerId);
        // Crashlytics (unlike Analytics) is meant to carry identifying context — a crash
        // report tied to a name/uid can actually be matched to a person for support, whereas
        // Google's Analytics terms disallow that kind of PII in event/user properties.
        setCrashReportingUserId(firebaseUser.uid);
        setCrashReportingUserContext({
          auth_provider: providerId,
          display_name: firebaseUser.displayName ?? '',
        });
        // Adopt the provider's photo as the profile avatar only if the user hasn't already
        // set one locally (photo or preset) — never clobber their choice.
        if (firebaseUser.photoURL) {
          const { profile, updateProfile } = useProfileStore.getState();
          if (!profile.avatarUri && !profile.avatarPreset) {
            updateProfile({ avatarUri: firebaseUser.photoURL });
          }
        }
      } else {
        setAuthData(null);
        setIsAuth(false);
        setIsGuest(false);
        setAnalyticsUserId(null);
        setCrashReportingUserId(null);
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
