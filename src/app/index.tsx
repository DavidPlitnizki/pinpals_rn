import { Redirect } from 'expo-router';

// AuthGate in _layout.tsx handles routing based on auth state
export default function Index() {
  return <Redirect href={'/(tabs)/map' as any} />;
}
