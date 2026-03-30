import { Stack } from 'expo-router';

import { Colors } from '../../design-system/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.white },
      }}
    >
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
