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
import { adoptProviderProfile } from '../store/useProfileStore';

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
        // Take the name and avatar Google/Apple provided, for anyone who hasn't set their
        // own. Anonymous users have neither, so this is a no-op for guests.
        void adoptProviderProfile({
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
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

  // Both providers run their result through here rather than relying on onAuthStateChanged
  // alone. That listener fires the moment Firebase has a user — which for Apple is before the
  // name exists: Apple returns fullName outside the credential, so signInWithApple writes it
  // to the Firebase profile in a second step, and updateProfile does not emit an auth-state
  // event. The listener had therefore already seen displayName === null and moved on, leaving
  // the profile stuck on the "User" placeholder with no later chance to fill it in.
  const adoptSignedInProfile = useCallback((data: AuthData) => {
    setAuthData(data);
    void adoptProviderProfile({ name: data.name, photoURL: data.photoURL });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    adoptSignedInProfile(await serviceSignInWithGoogle());
  }, [adoptSignedInProfile]);

  const signInWithApple = useCallback(async () => {
    adoptSignedInProfile(await serviceSignInWithApple());
  }, [adoptSignedInProfile]);

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
