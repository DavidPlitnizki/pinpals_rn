import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PinButton } from '../../../design-system/components/PinButton';
import { Spacing } from '../../../design-system/tokens';

interface SocialButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
}

export function SocialButtons({ onGooglePress, onApplePress }: SocialButtonsProps) {
  return (
    <View style={styles.container}>
      <PinButton
        title="Continue with Google"
        onPress={onGooglePress}
        variant="secondary"
        fullWidth
      />
      <PinButton
        title="Continue with Apple"
        onPress={onApplePress}
        variant="secondary"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s12,
  },
});
