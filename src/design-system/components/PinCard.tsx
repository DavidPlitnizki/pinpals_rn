import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, Spacing } from '../tokens';

interface PinCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function PinCard({ children, style }: PinCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
