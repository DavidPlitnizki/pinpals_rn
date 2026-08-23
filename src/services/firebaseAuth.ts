import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  updateProfile,
  signInAnonymously,
  signInWithCredential,
  linkWithCredential,
  deleteUser,
  GoogleAuthProvider,
  AppleAuthProvider,
  signOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { logLogin } from './analytics';
import { reportError } from './crashReporting';

// ── Types ────────────────────────────────────────────────────────────────────

// Mirrors Firebase's own providerId values ('google.com', 'apple.com') plus an 'anonymous'
// fallback for guest sessions, which have no entry in providerData at all.
export type AuthProviderId = 'google.com' | 'apple.com' | 'anonymous';

export interface AuthData {
  uid: string;
  email: string | null;
  name: string | null;
  // Only Google ever populates this — Sign in with Apple never returns a profile photo,
  // by design of Apple's privacy model.
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: AuthProviderId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function userToAuthData(user: FirebaseAuthTypes.User): AuthData {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    providerId: user.isAnonymous
      ? 'anonymous'
      : ((user.providerData[0]?.providerId as AuthProviderId | undefined) ?? 'google.com'),
  };
}

const ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please sign out and sign in again, then retry.',
};

// A user backing out of the provider sheet isn't a fault — reporting it would bury the real
// auth failures under noise.
const USER_CANCELLED_CODES = ['ERR_REQUEST_CANCELED', 'auth/cancelled-popup-request'];

function isUserCancellation(error: any): boolean {
  const code = error?.code as string | undefined;
  if (code && USER_CANCELLED_CODES.includes(code)) return true;
  return typeof error?.message === 'string' && error.message.includes('cancelled');
}

export function mapFirebaseError(error: any): string {
  const code = error?.code as string | undefined;
  if (code && ERROR_MAP[code]) return ERROR_MAP[code];
  return error?.message ?? 'Something went wrong. Please try again.';
}

// ── Anonymous (Guest) ────────────────────────────────────────────────────────

export async function loginAnonymously(): Promise<AuthData> {
  const credential = await signInAnonymously(getAuth());
  logLogin('anonymous');
  return userToAuthData(credential.user);
}

// ── Social (Google / Apple) ─────────────────────────────────────────────────

// A guest (anonymous) user signing in with a real provider should keep their local data —
// linking preserves the existing uid. If that credential already belongs to a different
// account (they'd used Google/Apple here before, as a different guest session), linking
// fails and we fall back to signing into that existing account instead, abandoning this
// guest session's data.
async function linkOrSignIn(credential: FirebaseAuthTypes.AuthCredential): Promise<AuthData> {
  const auth = getAuth();
  const current = auth.currentUser;

  if (current?.isAnonymous) {
    try {
      const result = await linkWithCredential(current, credential);
      return userToAuthData(result.user);
    } catch (error: any) {
      const code = error?.code as string | undefined;
      if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
        throw error;
      }
      // Fall through to a plain sign-in below.
    }
  }

  const result = await signInWithCredential(auth, credential);
  return userToAuthData(result.user);
}

let googleConfigured = false;
function ensureGoogleConfigured(): void {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<AuthData> {
  try {
    ensureGoogleConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw new Error('Google Sign-In was cancelled.');
    }
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google Sign-In did not return an ID token.');

    const credential = GoogleAuthProvider.credential(idToken);
    const authData = await linkOrSignIn(credential);
    logLogin('google.com');
    return authData;
  } catch (error) {
    // The original error (code + native stack) is lost once it's replaced by the friendly
    // message below, so it goes to Crashlytics first.
    if (!isUserCancellation(error)) reportError('auth', error, 'google sign-in failed');
    throw new Error(mapFirebaseError(error));
  }
}

export async function signInWithApple(): Promise<AuthData> {
  try {
    // Apple requires a nonce round-trip for replay protection: the hashed nonce goes to
    // Apple, the raw one goes to Firebase (as the credential's `secret`) alongside the
    // identity token Apple returns.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      throw new Error('Apple Sign-In did not return an identity token.');
    }

    // AppleAuthProvider.credential is a static method (not `new OAuthProvider(...)`) —
    // that's the RNFB-specific provider built for this native flow.
    const credential = AppleAuthProvider.credential(appleCredential.identityToken, rawNonce);

    const authData = await linkOrSignIn(credential);
    logLogin('apple.com');

    // Apple only ever returns the user's name on their very first authorization — Firebase
    // won't pick it up from the credential alone, so persist it to the profile ourselves.
    const fullName = appleCredential.fullName;
    const displayName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ');
    if (displayName && !authData.name) {
      const current = getAuth().currentUser;
      if (current) {
        await updateProfile(current, { displayName });
        authData.name = displayName;
      }
    }

    return authData;
  } catch (error: any) {
    if (error?.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Apple Sign-In was cancelled.');
    }
    reportError('auth', error, 'apple sign-in failed');
    throw new Error(mapFirebaseError(error));
  }
}

// ── Account Deletion ─────────────────────────────────────────────────────────

// Guideline 5.1.1(v) requires actually deleting the account, not just signing out. Firebase
// can refuse this with `auth/requires-recent-login` if the session is stale — the caller
// surfaces that as a "sign in again and retry" message rather than a silent no-op.
export async function deleteAccount(): Promise<void> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No signed-in user to delete.');
  try {
    await deleteUser(user);
  } catch (error: any) {
    reportError('auth', error, 'account deletion failed');
    // The stock advice for a stale session is "sign in again, then retry" — impossible for
    // a guest, who has no credential to sign back in with. Their data is local anyway, so
    // signing out (which drops the anonymous user) achieves what they asked for.
    if (error?.code === 'auth/requires-recent-login' && user.isAnonymous) {
      await signOut(getAuth());
      return;
    }
    throw new Error(mapFirebaseError(error));
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(getAuth());
}

// ── Auth State ───────────────────────────────────────────────────────────────

export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return _onAuthStateChanged(getAuth(), callback);
}

export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return getAuth().currentUser;
}
