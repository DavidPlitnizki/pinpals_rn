import Mapbox from '@rnmapbox/maps';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '../contexts/AuthContext';

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#4A7C59',
              headerTitleStyle: { fontWeight: '600', color: '#1C2B22' },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
            <Stack.Screen
              name="create-meeting"
              options={{ title: 'Create Meeting', presentation: 'modal' }}
            />
            <Stack.Screen
              name="create-memory"
              options={{ title: 'Новое воспоминание', presentation: 'modal', headerShown: false }}
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
