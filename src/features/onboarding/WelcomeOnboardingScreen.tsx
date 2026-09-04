import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { useWelcomeOnboardingScreen } from './hooks/useWelcomeOnboardingScreen';

const START_ICON = <Ionicons name="arrow-forward" size={22} color={Colors.white} />;

// The door into the tour: one screen, one choice. Everything after this is a hint layered
// over a screen the person already opened for some other reason — this is the only point
// where the tour is the whole reason something is on screen, so it gets to say so plainly
// instead of introducing itself sideways through a tooltip.
export default function WelcomeOnboardingScreen() {
  const { handleStart, handleSkip } = useWelcomeOnboardingScreen();

  return (
    <SafeAreaView style={styles.container} edges={SAFE_EDGES}>
      <View style={styles.skipRow}>
        <CircleCloseButton onPress={handleSkip} size={44} accessibilityLabel="Skip the tour" />
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Let&apos;s take the tour</Text>
        <Text style={styles.subtitle}>
          See how to save a place and keep a memory of it — takes under a minute.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStart}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={styles.startLabel}>Start</Text>
        {START_ICON}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const SAFE_EDGES = ['top', 'bottom'] as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.s24,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.s8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.s12,
    maxWidth: 300,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.primary,
    marginBottom: Spacing.s24,
  },
  startLabel: {
    ...Typography.headline,
    fontSize: 18,
    color: Colors.white,
  },
});
