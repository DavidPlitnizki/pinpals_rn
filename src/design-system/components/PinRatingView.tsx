import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../tokens';

interface PinRatingViewProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  maxRating?: number;
}

export function PinRatingView({
  rating,
  onRatingChange,
  size = 20,
  maxRating = 5,
}: PinRatingViewProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = star <= Math.round(rating);
        const color = filled ? Colors.warning : Colors.neutral[300];

        if (onRatingChange) {
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange(star)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{'★'}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <Text key={star} style={{ fontSize: size, color, lineHeight: size + 4 }}>
            {'★'}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
  },
});
