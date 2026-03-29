import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../design-system/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.brand.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.neutral[900],
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-places"
        options={{
          title: 'My Places',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="bookmark" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple text-based icon using emoji/unicode
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    map: '🗺',
    search: '🔍',
    bookmark: '🔖',
    person: '👤',
  };

  return (
    <TabBarIconText icon={icons[name] ?? '●'} size={size} />
  );
}

import { Text } from 'react-native';
function TabBarIconText({ icon, size }: { icon: string; size: number }) {
  return (
    <Text style={{ fontSize: size - 2, lineHeight: size + 2 }}>{icon}</Text>
  );
}
