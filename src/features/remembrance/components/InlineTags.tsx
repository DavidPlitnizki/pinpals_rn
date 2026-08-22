import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { PRESET_TAGS } from '../../../shared/constants';

const HIT_SLOP_TAG = { top: 6, bottom: 6, left: 2, right: 2 };
const HIT_SLOP_ADD = { top: 6, bottom: 6, left: 4, right: 4 };

interface Props {
  tags: string[];
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

interface OptionProps {
  option: string;
  onSelect: (option: string) => void;
}

const Option = React.memo(function Option({ option, onSelect }: OptionProps) {
  const handlePress = useCallback(() => onSelect(option), [onSelect, option]);
  return (
    <TouchableOpacity style={styles.option} onPress={handlePress} hitSlop={HIT_SLOP_TAG}>
      <Text style={styles.optionText}>#{option}</Text>
    </TouchableOpacity>
  );
});

export function InlineTags({ tags, onAdd, onRemove }: Props) {
  const [picking, setPicking] = useState(false);

  const openPicker = useCallback(() => setPicking(true), []);

  const handleSelect = useCallback(
    (tag: string) => {
      onAdd(tag);
      setPicking(false);
    },
    [onAdd],
  );

  const available = PRESET_TAGS.filter((t) => !tags.includes(t));

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={onRemove} />
        ))}

        {!picking && available.length > 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={openPicker} hitSlop={HIT_SLOP_ADD}>
            <Text style={styles.addBtnText}>+ tag</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {picking && (
        <View style={styles.options}>
          {available.map((t) => (
            <Option key={t} option={t} onSelect={handleSelect} />
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s4,
  },
  option: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 2,
  },
  optionText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
});
