export type { AuthData } from './firebaseAuth';

export {
  logout,
  loginAnonymously,
  signInWithGoogle,
  signInWithApple,
  deleteAccount,
  onAuthStateChanged,
  getCurrentUser,
  mapFirebaseError,
} from './firebaseAuth';
