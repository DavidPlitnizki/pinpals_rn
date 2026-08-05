import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';
import { MemoryMood, MEMORY_MOODS, MOOD_CONFIG } from '../../models/types';

interface MoodPickerProps {
  selected?: MemoryMood;
  onSelect: (mood: MemoryMood) => void;
}

interface MoodItemProps {
  mood: MemoryMood;
  isSelected: boolean;
  onSelect: (mood: MemoryMood) => void;
}

const MoodItem = React.memo(function MoodItem({ mood, isSelected, onSelect }: MoodItemProps) {
  const config = MOOD_CONFIG[mood];
  const handlePress = useCallback(() => onSelect(mood), [onSelect, mood]);

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: isSelected ? config.color : Colors.neutral[50],
          borderColor: isSelected ? config.color : Colors.neutral[200],
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: isSelected ? Colors.white : Colors.text.primary }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
});

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MemoryMood>) => (
      <MoodItem mood={item} isSelected={selected === item} onSelect={onSelect} />
    ),
    [selected, onSelect],
  );

  return (
    <FlatList
      data={MEMORY_MOODS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
    />
  );
}

function keyExtractor(item: MemoryMood) {
  return item;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s8,
  },
  item: {
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    minWidth: 80,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.s4,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
