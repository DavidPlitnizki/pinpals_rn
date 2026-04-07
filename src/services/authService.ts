export type { AuthData } from "./firebaseAuth";

export {
  login,
  signUp,
  logout,
  loginAnonymously,
  sendPasswordReset,
  onAuthStateChanged,
  getCurrentUser,
  mapFirebaseError,
} from "./firebaseAuth";
