# Phase 2 — Social Auth & Social Features

## Auth: Google Sign-In + Apple Sign-In

### Packages
```bash
npx expo install @react-native-google-signin/google-signin expo-apple-authentication
```

### Firebase Console
- Enable Google provider → note `webClientId`
- Enable Apple provider → configure Service ID + key in Apple Developer portal

### app.json plugins
```json
["@react-native-google-signin/google-signin", { "iosUrlScheme": "<REVERSED_CLIENT_ID>" }],
"expo-apple-authentication"
```

### Code changes
- `src/services/firebaseAuth.ts` — add `signInWithGoogle()` and `signInWithApple()`
- `src/contexts/AuthContext.tsx` — expose social methods in context
- `src/features/auth/hooks/useLoginScreen.ts` — wire `handleGooglePress` / `handleApplePress`
- `src/features/auth/hooks/useSignUpScreen.ts` — same
- `src/features/auth/components/SocialButtons.tsx` — optional: hide Apple on Android

### Notes
- Social buttons UI already exists (shows "Coming soon" alert)
- Anonymous users can link accounts via `linkWithCredential()` in Phase 2

## Social Features (TBD)
- Chat
- Location sharing
- Friends
- Real backend integration
