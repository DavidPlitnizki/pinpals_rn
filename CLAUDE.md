# Pinpals RN

## Overview
Pinpals — React Native (Expo) приложение для отметки мест на карте, планирования встреч, сохранения заметок и шаринга локации с друзьями.

## Tech Stack
- **React Native** 0.83 + **Expo** 55 (canary)
- **Expo Router** — file-based routing
- **Zustand** + AsyncStorage — стейт и персистентность
- **react-native-maps** — карты
- **Architecture**: Feature-sliced, screen + hook per feature

## Project Structure
```
src/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout: AuthProvider + AuthGate + Stack
│   ├── index.tsx                 # Entry — AuthGate handles redirect
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── sign-up.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/                   # Main app tabs (authenticated / guest)
│   │   ├── map.tsx
│   │   ├── explore.tsx
│   │   ├── my-places.tsx
│   │   └── profile.tsx
│   ├── place/[id].tsx
│   └── create-meeting.tsx        # Modal
├── features/
│   ├── auth/                     # Login, SignUp, ResetPassword
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── ResetPasswordScreen.tsx
│   │   ├── hooks/
│   │   └── components/           # AuthDivider, SocialButtons
│   ├── map/
│   ├── explore/
│   ├── my-places/
│   ├── place-detail/
│   ├── create-meeting/
│   └── profile/
├── design-system/
│   ├── tokens.ts                 # Colors, Spacing, Radii, Typography
│   └── components/               # PinButton, PinCard, PinChip, PinTextField, PinRatingView
├── contexts/
│   └── AuthContext.tsx           # isAuth, isGuest, isLoading, login/signUp/logout/skipAuth
├── services/
│   └── authService.ts            # Phase 1 stub — AsyncStorage only
├── store/
│   └── useAppStore.ts            # Zustand: places, notes, meetings, profile
└── models/
    └── types.ts                  # Place, PlaceNote, Meeting, UserProfile, PlaceCategory
```

## Design Tokens (`src/design-system/tokens.ts`)
- **Brand**: #4A7C59 (primary), #2C5C3F (dark), #D6EDE1 (light)
- **Accent**: #E8834A (primary), #FDEBD0 (light)
- **Neutral**: 50 (#F0F5F2) → 900 (#1C2B22)
- **Spacing**: s4, s8, s12, s16, s20, s24, s32, s48
- **Radii**: sm=8, md=12, lg=16, full=9999
- **Typography**: largeTitle (34/700) → caption (12/400)
- **error**: #E53935

## Architecture Conventions
- Each feature = folder with `XxxScreen.tsx` + `hooks/useXxxScreen.ts`
- Hooks own all logic; screens are pure render
- Design tokens via `Colors.*`, `Spacing.*`, `Radii.*`, `Typography.*`
- `StyleSheet.create()` in every screen/component
- `SafeAreaView edges={['top']}` (or `['top','bottom']` for auth/modal screens)
- `KeyboardAvoidingView + ScrollView` for forms

## Auth Flow
- **AuthGate** in `_layout.tsx`: unauthenticated + non-guest → `/(auth)/login`; authenticated or guest + in auth group → `/(tabs)/map`
- **Skip** sets `pinpals_guest` in AsyncStorage, treated same as auth for routing
- Social login (Google/Apple) — mock, shows `Alert` in Phase 1
- `authService.ts` — no real backend; `login()`/`signUp()` just persist to AsyncStorage

## Development Phases
- **Phase 1** (current): Соло-фичи — карта, explore, my places, place detail, meetings, profile, mock auth
- **Phase 2**: Социальные фичи — чат, шаринг локации, друзья, реальный backend auth

## Run
```bash
npx expo start
# iOS simulator
npx expo run:ios
```
