import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '../contexts/AuthContext';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuth, isGuest, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const canAccess = isAuth || isGuest;

    if (!canAccess && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (canAccess && inAuthGroup) {
      router.replace('/(tabs)/map');
    }
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
