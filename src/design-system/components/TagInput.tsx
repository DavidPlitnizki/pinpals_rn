import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

interface TagChipProps {
  tag: string;
  onRemove: (tag: string) => void;
}

const TagChip = React.memo(function TagChip({ tag, onRemove }: TagChipProps) {
  const handlePress = useCallback(() => onRemove(tag), [onRemove, tag]);
  return (
    <TouchableOpacity style={styles.chip} onPress={handlePress} activeOpacity={0.7}>
      <Text style={styles.chipText}>#{tag}</Text>
      <Text style={styles.chipRemove}>✕</Text>
    </TouchableOpacity>
  );
});

interface SuggestionChipProps {
  suggestion: string;
  onSelect: (suggestion: string) => void;
}

const SuggestionChip = React.memo(function SuggestionChip({
  suggestion,
  onSelect,
}: SuggestionChipProps) {
  const handlePress = useCallback(() => onSelect(suggestion), [onSelect, suggestion]);
  return (
    <TouchableOpacity style={styles.suggestionChip} onPress={handlePress}>
      <Text style={styles.suggestionText}>#{suggestion}</Text>
    </TouchableOpacity>
  );
});

export function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
  placeholder = 'Add a tag...',
}: TagInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const tag = text.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onAdd(tag);
      setText('');
    }
  }, [text, tags, onAdd]);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onAdd(suggestion);
      setText('');
    },
    [onAdd],
  );

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.includes(text.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {tags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={onRemove} />
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
            <SuggestionChip key={s} suggestion={s} onSelect={handleSelectSuggestion} />
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
