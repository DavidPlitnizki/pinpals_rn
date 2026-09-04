import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../tokens';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface CompanionInputProps {
  companions: string[];
  onRemove: (name: string) => void;
  placeholder?: string;
  // Opens the picker, which is where names are actually entered — from the address book or by
  // hand. Omitted only when a caller has nowhere to put the picker; the chips then still work.
  onOpenPicker?: () => void;
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

// Who you were with: the chips already added, and one control to add more.
//
// That control looks like a text field but is a button. Typing used to happen here, with a
// separate button beside it for the address book — two ways in, one of which could not search
// anything. Now both live in the picker: you type, the address book filters as you go, and a
// name it does not know is simply the one you typed. Nothing is lost when contacts are
// refused, because the same field is still there to type into.
export function CompanionInput({
  companions,
  onRemove,
  placeholder = 'Name...',
  onOpenPicker,
}: CompanionInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {companions.map((name) => (
          <CompanionChip key={name} name={name} onRemove={onRemove} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.field}
        onPress={onOpenPicker}
        disabled={!onOpenPicker}
        accessibilityRole="button"
        accessibilityLabel="Add someone you were with"
      >
        <Text style={styles.fieldPlaceholder}>{placeholder}</Text>
        <Ionicons name="person-add-outline" size={20} color={Colors.brand.primary} />
      </TouchableOpacity>
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
  // Dressed as the text field it replaces, so it still reads as "type a name here".
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: Spacing.s12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
  },
  fieldPlaceholder: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
});
