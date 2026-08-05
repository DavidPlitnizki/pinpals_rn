import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { PIN_COLOR_PRESETS } from '../../shared/constants';
import { Colors, Spacing } from '../tokens';

const SWATCH_SIZE = 36;

interface SwatchProps {
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
}

const Swatch = React.memo(function Swatch({ color, selected, onSelect }: SwatchProps) {
  const handlePress = useCallback(() => onSelect(color), [onSelect, color]);
  return (
    <TouchableOpacity
      style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {selected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
    </TouchableOpacity>
  );
});

interface Props {
  // undefined means "use the default My Places color" — represented by its own swatch
  // rather than folded into the preset list, so picking it is a real, visible choice.
  selected?: string;
  onSelect: (color: string | undefined) => void;
}

export function PinColorPicker({ selected, onSelect }: Props) {
  const handleSelectDefault = useCallback(() => onSelect(undefined), [onSelect]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.swatch,
          styles.defaultSwatch,
          selected === undefined && styles.swatchSelected,
        ]}
        onPress={handleSelectDefault}
        activeOpacity={0.75}
      >
        {selected === undefined && <Ionicons name="checkmark" size={16} color={Colors.white} />}
      </TouchableOpacity>
      {PIN_COLOR_PRESETS.map((color) => (
        <Swatch key={color} color={color} selected={selected === color} onSelect={onSelect} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  defaultSwatch: {
    backgroundColor: Colors.myPlace,
  },
  swatchSelected: {
    borderColor: Colors.neutral[900],
  },
});
