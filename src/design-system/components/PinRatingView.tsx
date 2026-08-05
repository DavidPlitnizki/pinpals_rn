import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../tokens';

const HIT_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

interface PinRatingViewProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  maxRating?: number;
}

interface StarProps {
  star: number;
  color: string;
  size: number;
  onRatingChange?: (rating: number) => void;
}

const Star = React.memo(function Star({ star, color, size, onRatingChange }: StarProps) {
  const handlePress = useCallback(() => onRatingChange?.(star), [onRatingChange, star]);
  const textStyle = { fontSize: size, color, lineHeight: size + 4 };

  if (onRatingChange) {
    return (
      <TouchableOpacity onPress={handlePress} hitSlop={HIT_SLOP} activeOpacity={0.7}>
        <Text style={textStyle}>{'★'}</Text>
      </TouchableOpacity>
    );
  }

  return <Text style={textStyle}>{'★'}</Text>;
});

export function PinRatingView({
  rating,
  onRatingChange,
  size = 20,
  maxRating = 5,
}: PinRatingViewProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Star
          key={star}
          star={star}
          color={star <= Math.round(rating) ? Colors.warning : Colors.neutral[300]}
          size={size}
          onRatingChange={onRatingChange}
        />
      ))}
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
