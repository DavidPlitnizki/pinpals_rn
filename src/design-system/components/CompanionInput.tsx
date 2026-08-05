import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface CompanionInputProps {
  companions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  placeholder?: string;
}

interface CompanionChipProps {
  name: string;
  onRemove: (name: string) => void;
}

const CompanionChip = React.memo(function CompanionChip({ name, onRemove }: CompanionChipProps) {
  const handleRemove = useCallback(() => onRemove(name), [onRemove, name]);

  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{name}</Text>
      <TouchableOpacity onPress={handleRemove} hitSlop={HIT_SLOP_8}>
        <Text style={styles.chipRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

export function CompanionInput({
  companions,
  onAdd,
  onRemove,
  placeholder = 'Name...',
}: CompanionInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const name = text.trim();
    if (name && !companions.includes(name)) {
      onAdd(name);
      setText('');
    }
  }, [text, companions, onAdd]);

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {companions.map((name) => (
          <CompanionChip key={name} name={name} onRemove={onRemove} />
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.secondary}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        {text.trim() ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleSubmit}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
    backgroundColor: Colors.brand.light,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s12,
    height: 32,
    gap: Spacing.s4,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  chipRemove: {
    ...Typography.caption,
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    ...Typography.body,
    color: Colors.text.primary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});
