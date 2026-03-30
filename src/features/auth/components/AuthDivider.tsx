import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../design-system/tokens';

export function AuthDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>or continue with</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  text: {
    ...Typography.footnote,
    color: Colors.neutral[400],
  },
});
