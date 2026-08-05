import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

const HIT_SLOP_TAG = { top: 6, bottom: 6, left: 2, right: 2 };
const HIT_SLOP_ADD = { top: 6, bottom: 6, left: 4, right: 4 };

interface Props {
  tags: string[];
  allTags?: string[]; // global suggestions
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

interface TagChipProps {
  tag: string;
  onRemove: (tag: string) => void;
}

const TagChip = React.memo(function TagChip({ tag, onRemove }: TagChipProps) {
  const handlePress = useCallback(() => onRemove(tag), [onRemove, tag]);
  return (
    <TouchableOpacity style={styles.chip} onPress={handlePress} hitSlop={HIT_SLOP_TAG}>
      <Text style={styles.chipText}>#{tag}</Text>
      <Text style={styles.chipRemove}>✕</Text>
    </TouchableOpacity>
  );
});

interface SuggestionProps {
  suggestion: string;
  onSelect: (suggestion: string) => void;
}

const Suggestion = React.memo(function Suggestion({ suggestion, onSelect }: SuggestionProps) {
  const handlePress = useCallback(() => onSelect(suggestion), [onSelect, suggestion]);
  return (
    <TouchableOpacity style={styles.suggestion} onPress={handlePress}>
      <Text style={styles.suggestionText}>#{suggestion}</Text>
    </TouchableOpacity>
  );
});

export function InlineTags({ tags, allTags = [], onAdd, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const openInput = useCallback(() => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(() => {
    const tag = text.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onAdd(tag);
    }
    setText('');
    setEditing(false);
  }, [text, tags, onAdd]);

  const handleBlur = useCallback(() => {
    if (text.trim()) {
      handleSubmit();
    } else {
      setEditing(false);
    }
  }, [text, handleSubmit]);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onAdd(suggestion);
      setText('');
      setEditing(false);
    },
    [onAdd],
  );

  const suggestions = allTags.filter(
    (s) => !tags.includes(s) && s.includes(text.toLowerCase()) && s.length > 0,
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        scrollEnabled={!editing}
      >
        {/* Existing tag chips */}
        {tags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={onRemove} />
        ))}

        {/* Add button or input */}
        {!editing ? (
          <TouchableOpacity style={styles.addBtn} onPress={openInput} hitSlop={HIT_SLOP_ADD}>
            <Text style={styles.addBtnText}>+ tag</Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="tag..."
            placeholderTextColor={Colors.neutral[300]}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onBlur={handleBlur}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </ScrollView>

      {/* Suggestions dropdown */}
      {editing && text.length > 0 && suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.slice(0, 4).map((s) => (
            <Suggestion key={s} suggestion={s} onSelect={handleSelectSuggestion} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.s4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    paddingRight: Spacing.s4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.light,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 3,
    gap: 3,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  chipRemove: {
    fontSize: 9,
    color: Colors.brand.dark,
    fontWeight: '700',
    lineHeight: 14,
  },
  addBtn: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.neutral[300],
  },
  addBtnText: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  input: {
    minWidth: 80,
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.primary,
    paddingHorizontal: Spacing.s4,
    ...Typography.caption,
    color: Colors.neutral[900],
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s4,
  },
  suggestion: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 2,
  },
  suggestionText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
});
