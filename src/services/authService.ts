import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "pinpals_auth";

export interface AuthData {
  email: string;
  name: string;
}

export async function login(email: string, password: string): Promise<void> {
  // Phase 1: local stub — just persist the session
  const data: AuthData = { email, name: email.split("@")[0] };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<void> {
  // Phase 1: local stub — just persist the session
  const data: AuthData = { email, name };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
  await AsyncStorage.removeItem("pinpals_guest");
}

export async function checkAuth(): Promise<AuthData | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

const GUEST_KEY = "pinpals_guest";

export async function skipAuth(): Promise<void> {
  await AsyncStorage.setItem(GUEST_KEY, "true");
}

export async function checkGuest(): Promise<boolean> {
  const val = await AsyncStorage.getItem(GUEST_KEY);
  return val === "true";
}

export async function clearGuest(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_KEY);
}
