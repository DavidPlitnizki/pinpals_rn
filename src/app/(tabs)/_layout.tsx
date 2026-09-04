import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import AnimatedTabBar from '../../design-system/components/AnimatedTabBar';
import { RemembranceTip } from '../../features/onboarding/components/RemembranceTip';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const renderTabBar = (props: React.ComponentProps<typeof AnimatedTabBar>) => (
  <AnimatedTabBar {...props} />
);

const SCREEN_OPTIONS = { headerShown: false } as const;
const MAP_OPTIONS = { title: 'Map' };
const REMEMBRANCE_OPTIONS = { title: 'Remembrance' };
const PROFILE_OPTIONS = { title: 'Profile' };

// The store subscription lives down here rather than in the layout, so a stage change re-renders
// this one line instead of the whole navigator and every screen mounted under it.
function RemembranceTipGate() {
  const stage = useOnboardingStore((state) => state.stage);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const completeRemembranceTip = useOnboardingStore((state) => state.completeRemembranceTip);

  if (!hydrated || stage !== 'remembrance-tip') return null;
  return <RemembranceTip onFinish={completeRemembranceTip} />;
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* @ts-ignore - type mismatch between expo-router and @react-navigation/bottom-tabs */}
      <Tabs tabBar={renderTabBar} screenOptions={SCREEN_OPTIONS}>
        <Tabs.Screen name="map" options={MAP_OPTIONS} />
        <Tabs.Screen name="remembrance" options={REMEMBRANCE_OPTIONS} />
        <Tabs.Screen name="profile" options={PROFILE_OPTIONS} />
      </Tabs>

      {/* Above the navigator so the hint floats over whichever tab is showing — it follows the
          tab bar, not the map. */}
      <RemembranceTipGate />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
