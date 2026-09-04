import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TooltipProps, useCopilot } from 'react-native-copilot';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { ONBOARDING_STEP_NUMBERS, ONBOARDING_TITLES } from '../steps';
import { OnboardingLabel } from './OnboardingLabel';

// Replaces react-native-copilot's stock tooltip, which ships its own blue-and-grey styling and
// a four-button footer. Both of this app's tours are a single step, so the only control that
// means anything is "got it" — a way out of the whole tour lives on the welcome screen now,
// the one place "skip everything" is still a live question.
export function OnboardingTooltip({ labels }: TooltipProps) {
  const { currentStep, goToNext, isLastStep, stop } = useCopilot();

  const handlePrimaryPress = useCallback(() => {
    if (isLastStep) {
      void stop();
      return;
    }
    void goToNext();
  }, [goToNext, isLastStep, stop]);

  const title = currentStep ? ONBOARDING_TITLES[currentStep.name] : undefined;
  const stepNumber = currentStep ? ONBOARDING_STEP_NUMBERS[currentStep.name] : undefined;

  return (
    <View style={styles.card}>
      <OnboardingLabel step={stepNumber} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{currentStep?.text}</Text>

      <View style={styles.footer}>
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
    marginTop: Spacing.s16,
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
