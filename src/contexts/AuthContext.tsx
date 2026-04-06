import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AuthData,
  login as serviceLogin,
  signUp as serviceSignUp,
  logout as serviceLogout,
  loginAnonymously,
  onAuthStateChanged,
} from "../services/authService";

interface AuthContextValue {
  isAuth: boolean;
  isGuest: boolean;
  isLoading: boolean;
  authData: AuthData | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  skipAuth: () => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    await serviceLogin(email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      await serviceSignUp(email, password, name);
    },
    []
  );

  const logout = useCallback(async () => {
    await serviceLogout();
  }, []);

  const skipAuth = useCallback(async () => {
    await loginAnonymously();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        isGuest,
        isLoading,
        authData,
        login,
        signUp,
        logout,
        skipAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
