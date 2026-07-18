# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (requires physical device or simulator with dev client)
npx expo start

# Run on iOS simulator
npx expo run:ios

# TypeScript check
npm run typecheck

# Lint (zero warnings allowed)
npm run lint

# Tests
npm test
npm run test:watch

# Single test file
npx jest src/features/auth/hooks/__tests__/useLoginScreen.test.ts

# Format
npm run format:fix
```

## Tech Stack

- **React Native** 0.83 + **Expo** 55 (canary, requires dev client — `expo-dev-client`)
- **Expo Router** — file-based routing under `src/app/`
- **Mapbox** (`@rnmapbox/maps`) — requires `EXPO_PUBLIC_MAPBOX_TOKEN` env var set in `.env.local`
- **Firebase** (`@react-native-firebase/auth`) — real email/password + anonymous auth
- **Zustand** + AsyncStorage — three separate persisted stores
- **react-native-reanimated** + **react-native-gesture-handler** — animations and gestures

## Project Structure

```
src/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root: GestureHandlerRootView > AuthProvider > AuthGate > Stack
│   ├── (auth)/                   # Unauthenticated group
│   ├── (tabs)/                   # map, remembrance, profile
│   ├── place/[id].tsx
│   ├── create-meeting.tsx        # Modal (presentation: 'modal')
│   └── create-memory.tsx         # Modal (headerShown: false)
├── features/
│   ├── auth/                     # LoginScreen, SignUpScreen, ResetPasswordScreen
│   ├── map/                      # MapScreen + AddPlaceModal, SearchSheet, FriendsSheet
│   ├── place-detail/             # PlaceDetailScreen + AddNoteModal
│   ├── remembrance/              # RemembranceScreen — timeline of memories/meetings
│   ├── create-memory/            # CreateMemoryScreen — add note/photos/mood to a place
│   ├── create-meeting/           # CreateMeetingScreen
│   └── profile/                  # ProfileScreen
├── design-system/
│   ├── tokens.ts                 # Colors, Spacing, Radii, Typography
│   └── components/               # PinButton, PinCard, PinChip, PinTextField, PinRatingView,
│                                 # AnimatedTabBar, MemoryCard, MoodPicker, CompanionInput, TagInput
├── contexts/
│   └── AuthContext.tsx           # isAuth, isGuest, isLoading, authData, login/signUp/logout/skipAuth
├── services/
│   ├── authService.ts            # Re-exports from firebaseAuth.ts (thin adapter)
│   └── firebaseAuth.ts           # Firebase Auth: login, signUp, sendPasswordReset, loginAnonymously, logout, onAuthStateChanged
├── store/
│   ├── usePlacesStore.ts         # Places + PlaceNotes, persisted as 'pinpals-places' (v3)
│   ├── useMeetingsStore.ts       # Meetings, persisted as 'pinpals-meetings'
│   └── useProfileStore.ts        # UserProfile, persisted as 'pinpals-profile'
├── models/
│   └── types.ts                  # Place, PlaceNote, Meeting, UserProfile, PlaceCategory, MemoryMood
├── hooks/
│   └── useDebouncedValue.ts
└── shared/
    └── constants.ts              # CATEGORY_COLORS, CATEGORIES, CATEGORY_LABELS
```

## Architecture Conventions

- Each feature = `XxxScreen.tsx` + `hooks/useXxxScreen.ts`; hooks own all logic, screens are pure render
- Design tokens via `Colors.*`, `Spacing.*`, `Radii.*`, `Typography.*` from `src/design-system/tokens.ts`
- `StyleSheet.create()` in every screen/component
- `SafeAreaView edges={['top']}` for tabs; `edges={['top','bottom']}` for auth/modal screens
- `KeyboardAvoidingView + ScrollView` for forms

## Auth Flow

**AuthGate** (`src/app/_layout.tsx`): subscribes to Firebase `onAuthStateChanged` via `AuthContext`. 
- Anonymous Firebase sign-in = guest mode (`isGuest: true`, `isAuth: false`)
- `skipAuth()` calls `loginAnonymously()` — Firebase anonymous, not AsyncStorage
- Unauthenticated & non-guest → `/(auth)/login`; authenticated or guest in auth group → `/(tabs)/map`

## Key Data Model Notes

- `Place.rating` is legacy (1–5 int); mood-based coloring via `PlaceNote.colorTag` and `PlaceNote.mood` (`MemoryMood`)
- `PlaceNote.companions` is `string[]` of names (Phase 1; Phase 2 will link to real users)
- `usePlacesStore` version 3 — has migration logic; bump version + add migration when changing schema
- `MOOD_CONFIG` in `types.ts` maps each `MemoryMood` to emoji, color, label

## Environment

Requires `.env.local` (gitignored):
```
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```
Firebase config is in `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) — committed to the repo.

## Development Phases

- **Phase 1** (current): Solo features — map, remembrance, place detail, meetings, profile, Firebase auth (email + anonymous)
- **Phase 2**: Social — chat, live location sharing, friends, linking companions to real users
