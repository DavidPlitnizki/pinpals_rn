import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  reload,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthData {
  uid: string;
  email: string | null;
  name: string | null;
  isAnonymous: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function userToAuthData(user: FirebaseAuthTypes.User): AuthData {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    isAnonymous: user.isAnonymous,
  };
}

const ERROR_MAP: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Invalid email address.",
  "auth/wrong-password": "Incorrect password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/invalid-credential": "Invalid credentials. Please try again.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/user-disabled": "This account has been disabled.",
};

export function mapFirebaseError(error: any): string {
  const code = error?.code as string | undefined;
  if (code && ERROR_MAP[code]) return ERROR_MAP[code];
  return error?.message ?? "Something went wrong. Please try again.";
}

// ── Email / Password ─────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthData> {
  try {
    const credential = await signInWithEmailAndPassword(
      getAuth(),
      email,
      password
    );
    return userToAuthData(credential.user);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthData> {
  try {
    const credential = await createUserWithEmailAndPassword(
      getAuth(),
      email,
      password
    );
    await updateProfile(credential.user, { displayName: name });
    await reload(credential.user);
    return userToAuthData(credential.user);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

// ── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuth(), email);
}

// ── Anonymous (Guest) ────────────────────────────────────────────────────────

export async function loginAnonymously(): Promise<AuthData> {
  const credential = await signInAnonymously(getAuth());
  return userToAuthData(credential.user);
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(getAuth());
}

// ── Auth State ───────────────────────────────────────────────────────────────

export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void
): () => void {
  return _onAuthStateChanged(getAuth(), callback);
}

export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return getAuth().currentUser;
}
