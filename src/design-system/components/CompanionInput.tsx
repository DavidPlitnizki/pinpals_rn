import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../tokens';

interface CompanionInputProps {
  companions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  placeholder?: string;
}

export function CompanionInput({
  companions,
  onAdd,
  onRemove,
  placeholder = 'Имя...',
}: CompanionInputProps) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const name = text.trim();
    if (name && !companions.includes(name)) {
      onAdd(name);
      setText('');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {companions.map((name) => (
          <View key={name} style={styles.chip}>
            <Text style={styles.chipText}>{name}</Text>
            <TouchableOpacity
              onPress={() => onRemove(name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          </View>
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
