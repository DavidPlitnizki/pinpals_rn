import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '../../../design-system/components/AnimatedTabBar';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { OnboardingArrow } from './OnboardingArrow';
import { OnboardingLabel } from './OnboardingLabel';

// The tour's last word, floated just above the tab bar. Deliberately not part of
// AnimatedTabBar: the tab bar is a design-system component and knows nothing about onboarding,
// and the hint only needs to sit over the middle of three tabs — which is the centre of the
// screen — to be pointing at Remembrance.
//
// The bubble takes presses (it holds the button that ends the tour); everything around it does
// not, so the tab it is pointing at stays reachable — going to look and being told the tour is
// over are both things the user is allowed to do first.
interface Props {
  onFinish: () => void;
}

export function RemembranceTip({ onFinish }: Props) {
  const insets = useSafeAreaInsets();

  // Sits on top of the tab bar rather than over it — the labels it is pointing at have to stay
  // readable, and the arrow has to end at the tab rather than somewhere past it.
  const wrapStyle = useMemo(
    () => [styles.wrap, { bottom: insets.bottom + TAB_BAR_HEIGHT }],
    [insets.bottom],
  );

  return (
    <View style={wrapStyle} pointerEvents="box-none">
      <View style={styles.bubble}>
        <View style={styles.labelRow}>
          <OnboardingLabel step={5} />
        </View>
        <Text style={styles.title}>Your memories live here</Text>
        <Text style={styles.text}>Every place you keep comes back as a story worth rereading.</Text>

        {/* The only thing that marks the tour finished. Opening the tab does not: someone can
            look, come back and still want the last word on screen. */}
        <TouchableOpacity style={styles.finishButton} onPress={onFinish} accessibilityRole="button">
          <Text style={styles.finishLabel}>Finish</Text>
        </TouchableOpacity>
      </View>
      <OnboardingArrow size={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bubble: {
    maxWidth: 320,
    marginHorizontal: Spacing.s24,
    marginBottom: Spacing.s4,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.s2,
  },
  text: {
    ...Typography.footnote,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: Spacing.s2,
  },
  labelRow: { alignItems: 'center' },
  finishButton: {
    alignSelf: 'center',
    marginTop: Spacing.s12,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.primary,
  },
  finishLabel: {
    ...Typography.subheadline,
    fontFamily: Typography.headline.fontFamily,
    color: Colors.white,
  },
});
