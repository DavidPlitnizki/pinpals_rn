import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../design-system/tokens';
import { ONBOARDING_LABEL, ONBOARDING_TOTAL_STEPS } from '../steps';

interface Props {
  // This hint's place in the tour, 1-indexed. Omitted only where a card genuinely has no
  // fixed position of its own — everywhere else it renders "n/n" next to the eyebrow, so the
  // tour reads as a sequence with a known end rather than an open stream of pop-ups.
  step?: number;
}

// The eyebrow every hint in the tour wears, plus its position in the sequence. Small, quiet
// and identical everywhere, so the hints read as one thing rather than five unrelated pop-ups.
//
// A fixed gap between the two texts rather than `justifyContent: 'space-between'`: this sits
// inside containers with very different widths and cross-axis alignment (a full-width
// tooltip card, a centred column of hints), and space-between only reads correctly when the
// row is stretched to its container's full width — which not all of them do.
export function OnboardingLabel({ step }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{ONBOARDING_LABEL.toUpperCase()}</Text>
      {step !== undefined && (
        <Text style={styles.count}>
          {step}/{ONBOARDING_TOTAL_STEPS}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  label: {
    ...Typography.caption,
    fontFamily: Typography.headline.fontFamily,
    letterSpacing: 1,
    color: Colors.accent.primary,
  },
  count: {
    ...Typography.caption,
    fontFamily: Typography.headline.fontFamily,
    color: Colors.neutral[400],
  },
});
