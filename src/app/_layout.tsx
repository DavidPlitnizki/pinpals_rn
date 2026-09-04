import Mapbox from '@rnmapbox/maps';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { trackAppOpen } from '../services/analytics';
import {
  installGlobalCrashHandlers,
  setCrashReportingUserContext,
} from '../services/crashReporting';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useProfileStore } from '../store/useProfileStore';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
SplashScreen.preventAutoHideAsync();

// Matches Colors.background — the window behind the screens, visible for a frame during
// navigation transitions and rotation.
const APP_BACKGROUND = '#FAF8F4';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuth, isGuest, isLoading } = useAuth();
  const onboardingStage = useOnboardingStore((state) => state.stage);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const attributionCompleted = useOnboardingStore((state) => state.attributionCompleted);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Both have to be known before any redirect decision is made — deciding on the default
    // 'welcome' stage before the real one has loaded from disk would send a returning user
    // through the intro screen again, every cold start.
    if (isLoading || !onboardingHydrated) return;

    SplashScreen.setOptions({ duration: 400, fade: true });
    SplashScreen.hideAsync();

    // Reachable signed out, on purpose: the Terms and Privacy Policy links live on the
    // sign-in screen, i.e. they are used by people who have no account yet. Without this
    // exception the gate saw a non-(auth) route with no session and replaced it with the
    // login screen mid-navigation, so the links did nothing at all. App Review requires the
    // policy to be reachable inside the app, and this is the only place it is linked before
    // signing in.
    if (segments[0] === 'legal') return;

    const inAuthGroup = segments[0] === '(auth)';
    const canAccess = isAuth || isGuest;
    const needsWelcome = onboardingStage === 'welcome';
    // The tour is over (finished or skipped) but the one-time "where did you hear about us"
    // question hasn't been answered or dismissed yet.
    const needsAttribution = onboardingStage === 'done' && !attributionCompleted;

    if (!canAccess && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (canAccess && inAuthGroup) {
      router.replace(needsWelcome ? '/welcome' : needsAttribution ? '/attribution' : '/(tabs)/map');
      return;
    }

    // Covers a fresh sign-in interrupted before Start or Skip was pressed — the app killed on
    // the welcome screen, say. Without this the next launch's index redirect (see
    // app/index.tsx) lands straight on the map, `inAuthGroup` is already false by then, and
    // the branch above never runs again — the welcome screen would be skipped for good and
    // the whole tour after it would never start, stuck forever on a stage nothing advances.
    if (canAccess && needsWelcome && segments[0] !== 'welcome') {
      router.replace('/welcome');
      return;
    }

    // The tour can end from deep inside the tabs (the last hint's Finish, or abandoning the
    // place form mid-tour) — nothing in either of those call sites navigates anywhere, so this
    // is what actually gets the attribution screen on screen once `stage` flips to 'done'.
    if (canAccess && needsAttribution && segments[0] !== 'attribution') {
      router.replace('/attribution');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuth,
    isGuest,
    isLoading,
    onboardingStage,
    onboardingHydrated,
    attributionCompleted,
    segments,
  ]);

  if (isLoading || !onboardingHydrated) return <View style={styles.loading} />;

  return <>{children}</>;
}

// Every screen in the app is light — there is no dark theme and no font-size control, so
// both the window background behind the screens and the status bar are simply fixed. This
// used to read a settings store that no UI could ever change.
function AppearanceEffects() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(APP_BACKGROUND);
  }, []);

  return <StatusBar style="dark" />;
}

export default function RootLayout() {
  useEffect(() => {
    installGlobalCrashHandlers();
    void trackAppOpen();
    // Seeds crash reports with the app's own profile name right away — otherwise it's only
    // set once the user opens Profile and saves, leaving early-session crashes anonymous.
    setCrashReportingUserContext({ profile_name: useProfileStore.getState().profile.name });
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AppearanceEffects />
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#4A7C59',
              headerTitleStyle: { fontWeight: '600', color: '#1C2B22' },
              // Otherwise the back button falls back to the previous screen's route/group
              // name (e.g. literally "(tabs)") when that screen sets no title of its own.
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen
              name="attribution"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
            <Stack.Screen
              name="create-memory"
              options={{ title: 'New Memory', presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen name="legal" options={{ title: '', presentation: 'modal' }} />
            <Stack.Screen
              name="weather-detail"
              options={{ title: '', presentation: 'modal', headerShown: false }}
            />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
