import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors, Typography } from '../../../design-system/tokens';
import { ONBOARDING_LABEL } from '../steps';

// The eyebrow every hint in the tour wears. Small, quiet and identical everywhere, so the
// hints read as one sequence with an end rather than as five unrelated pop-ups.
export function OnboardingLabel() {
  return <Text style={styles.label}>{ONBOARDING_LABEL.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...Typography.caption,
    fontFamily: Typography.headline.fontFamily,
    letterSpacing: 1,
    color: Colors.accent.primary,
  },
});
