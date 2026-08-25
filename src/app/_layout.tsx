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
import { useProfileStore } from '../store/useProfileStore';
import { applyFontScale, useResolvedTheme } from '../shared/appearance';
import { useSettingsStore } from '../store/useSettingsStore';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuth, isGuest, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

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

    if (!canAccess && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (canAccess && inAuthGroup) {
      router.replace('/(tabs)/map');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, isGuest, isLoading, segments]);

  if (isLoading) return <View style={styles.loading} />;

  return <>{children}</>;
}

function AppearanceEffects() {
  const fontScale = useSettingsStore((s) => s.fontScale);
  const resolvedTheme = useResolvedTheme();

  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(resolvedTheme === 'dark' ? '#1C2B22' : '#FAF8F4');
  }, [resolvedTheme]);

  // Screens are light-background regardless of theme preference, so the status bar icons
  // stay dark everywhere rather than following resolvedTheme (which would turn them white
  // and make them disappear against those light backgrounds).
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
