import { Tabs } from 'expo-router';
import AnimatedTabBar from '../../design-system/components/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="remembrance" options={{ title: 'Remembrance' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
