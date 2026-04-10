import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
  placeholder = 'Добавить тег...',
}: TagInputProps) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const tag = text.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onAdd(tag);
      setText('');
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.includes(text.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.chip}
            onPress={() => onRemove(tag)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>#{tag}</Text>
            <Text style={styles.chipRemove}>✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        autoCapitalize="none"
      />

      {text.length > 0 && filteredSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {filteredSuggestions.slice(0, 5).map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestionChip}
              onPress={() => {
                onAdd(s);
                setText('');
              }}
            >
              <Text style={styles.suggestionText}>#{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.light,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s12,
    height: 32,
    gap: Spacing.s4,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  chipRemove: {
    ...Typography.caption,
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    ...Typography.body,
    color: Colors.text.primary,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s4,
  },
  suggestionChip: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s12,
    height: 28,
    justifyContent: 'center',
  },
  suggestionText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
