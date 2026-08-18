import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../tokens';

interface TagPickerProps {
  tags: string[];
  options: string[];
  onToggle: (tag: string) => void;
}

interface TagOptionProps {
  tag: string;
  selected: boolean;
  onToggle: (tag: string) => void;
}

const TagOption = React.memo(function TagOption({ tag, selected, onToggle }: TagOptionProps) {
  const handlePress = useCallback(() => onToggle(tag), [onToggle, tag]);
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>#{tag}</Text>
    </TouchableOpacity>
  );
});

export function TagPicker({ tags, options, onToggle }: TagPickerProps) {
  return (
    <View style={styles.container}>
      {options.map((tag) => (
        <TagOption key={tag} tag={tag} selected={tags.includes(tag)} onToggle={onToggle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  chip: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s12,
    height: 32,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});
