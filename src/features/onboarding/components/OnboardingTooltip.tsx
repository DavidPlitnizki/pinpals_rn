import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TooltipProps, useCopilot } from 'react-native-copilot';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { MAP_TIP_STEP, ONBOARDING_TITLES } from '../steps';
import { OnboardingLabel } from './OnboardingLabel';

// Replaces react-native-copilot's stock tooltip, which ships its own blue-and-grey styling and
// a four-button footer. Both of this app's tours are a single step, so the only controls that
// mean anything are "got it" and a way out.
export function OnboardingTooltip({ labels }: TooltipProps) {
  const { currentStep, goToNext, isLastStep, stop } = useCopilot();
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);

  const handlePrimaryPress = useCallback(() => {
    if (isLastStep) {
      void stop();
      return;
    }
    void goToNext();
  }, [goToNext, isLastStep, stop]);

  // Ends the whole tour, not just this hint. Copilot's own cursor knows nothing about the
  // later steps — they live in the persisted stage — so the store has to be told first: the
  // stop below reports this step as seen, and that report is a no-op once the stage is done.
  const handleSkipPress = useCallback(() => {
    skipOnboarding();
    void stop();
  }, [skipOnboarding, stop]);

  const title = currentStep ? ONBOARDING_TITLES[currentStep.name] : undefined;
  // Offered on the way in and nowhere else. Every tour after this one is a single hint
  // attached to something the user has already chosen to open, where "skip the whole tour" is
  // no longer the question being asked.
  const canSkip = currentStep?.name === MAP_TIP_STEP;

  return (
    <View style={styles.card}>
      <OnboardingLabel />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{currentStep?.text}</Text>

      <View style={styles.footer}>
        {canSkip && (
          <TouchableOpacity onPress={handleSkipPress} hitSlop={HIT_SLOP}>
            <Text style={styles.skip}>{labels.skip ?? 'Skip'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handlePrimaryPress}
          style={styles.primaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.primaryLabel}>
            {isLastStep ? (labels.finish ?? 'Got it') : (labels.next ?? 'Next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s16,
  },
  title: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginTop: Spacing.s2,
    marginBottom: Spacing.s4,
  },
  text: {
    ...Typography.callout,
    color: Colors.neutral[600],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.s16,
    marginTop: Spacing.s16,
  },
  skip: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  primaryButton: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s8,
  },
  primaryLabel: {
    ...Typography.subheadline,
    fontFamily: Typography.headline.fontFamily,
    color: Colors.white,
  },
});
