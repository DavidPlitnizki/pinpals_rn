import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AuthData,
  checkAuth,
  checkGuest,
  login as serviceLogin,
  logout as serviceLogout,
  signUp as serviceSignUp,
  skipAuth as serviceSkipAuth,
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
    Promise.all([checkAuth(), checkGuest()]).then(([data, guest]) => {
      setAuthData(data);
      setIsAuth(data !== null);
      setIsGuest(guest);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await serviceLogin(email, password);
    const data = await checkAuth();
    setAuthData(data);
    setIsAuth(true);
    setIsGuest(false);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      await serviceSignUp(email, password, name);
      const data = await checkAuth();
      setAuthData(data);
      setIsAuth(true);
      setIsGuest(false);
    },
    []
  );

  const logout = useCallback(async () => {
    await serviceLogout();
    setAuthData(null);
    setIsAuth(false);
    setIsGuest(false);
  }, []);

  const skipAuth = useCallback(async () => {
    await serviceSkipAuth();
    setIsGuest(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, isGuest, isLoading, authData, login, signUp, logout, skipAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
