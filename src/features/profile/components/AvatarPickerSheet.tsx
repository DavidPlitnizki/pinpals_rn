import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Spacing, Typography } from '../../../design-system/tokens';
import { AVATAR_PRESETS, AvatarPreset } from '../../../shared/avatarPresets';

interface PresetSwatchProps {
  preset: AvatarPreset;
  selected: boolean;
  onSelect: (id: string) => void;
}

const PresetSwatch = React.memo(function PresetSwatch({
  preset,
  selected,
  onSelect,
}: PresetSwatchProps) {
  const handlePress = useCallback(() => onSelect(preset.id), [onSelect, preset.id]);
  return (
    <TouchableOpacity
      style={[styles.swatch, { backgroundColor: preset.color }, selected && styles.swatchSelected]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={styles.swatchEmoji}>{preset.emoji}</Text>
    </TouchableOpacity>
  );
});

interface NoneSwatchProps {
  selected: boolean;
  onSelect: () => void;
}

const NoneSwatch = React.memo(function NoneSwatch({ selected, onSelect }: NoneSwatchProps) {
  return (
    <TouchableOpacity
      style={[styles.swatch, styles.noneSwatch, selected && styles.swatchSelected]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      <Ionicons name="close" size={26} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );
});

interface Props {
  visible: boolean;
  selectedPresetId: string | undefined;
  onClose: () => void;
  onPickPhoto: () => void;
  onSelectPreset: (id: string) => void;
  onClearPreset: () => void;
}

export function AvatarPickerSheet({
  visible,
  selectedPresetId,
  onClose,
  onPickPhoto,
  onSelectPreset,
  onClearPreset,
}: Props) {
  const { width } = useWindowDimensions();
  const rowGap = useMemo(() => computeSwatchGap(width), [width]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile Photo</Text>
          <CircleCloseButton onPress={onClose} />
        </View>

        <View style={styles.content}>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.cameraCircle} onPress={onPickPhoto} activeOpacity={0.8}>
              <Ionicons name="camera" size={30} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.photoLabel}>Take Photo or Choose from Library</Text>
          </View>

          <Text style={styles.sectionTitle}>Or pick an avatar</Text>
          <View style={[styles.presetsRow, { columnGap: rowGap, rowGap }]}>
            <NoneSwatch selected={selectedPresetId === undefined} onSelect={onClearPreset} />
            {AVATAR_PRESETS.map((preset) => (
              <PresetSwatch
                key={preset.id}
                preset={preset}
                selected={selectedPresetId === preset.id}
                onSelect={onSelectPreset}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const CAMERA_SIZE = 72;
const SWATCH_SIZE = 60;
const MIN_SWATCH_GAP = Spacing.s16;

// Fixed swatch size + variable columns per row means a static gap leaves uneven space on
// the last row. Instead, pick how many swatches fit per row at this width (at least
// MIN_SWATCH_GAP apart), then spread the remainder evenly so every gap — within a row and
// between rows — is identical and the grid fills the content area edge to edge.
function computeSwatchGap(windowWidth: number): number {
  const containerWidth = windowWidth - Spacing.s20 * 2;
  const columns = Math.max(
    1,
    Math.floor((containerWidth + MIN_SWATCH_GAP) / (SWATCH_SIZE + MIN_SWATCH_GAP)),
  );
  if (columns <= 1) return MIN_SWATCH_GAP;
  return (containerWidth - columns * SWATCH_SIZE) / (columns - 1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: { ...Typography.headline, color: Colors.neutral[900] },
  content: { padding: Spacing.s20, alignItems: 'center' },
  photoRow: { alignItems: 'center', gap: Spacing.s12 },
  cameraCircle: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  photoLabel: { ...Typography.subheadline, color: Colors.neutral[600] },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    marginTop: Spacing.s32,
    marginBottom: Spacing.s16,
    alignSelf: 'flex-start',
  },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch' },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchEmoji: { fontSize: 30 },
  swatchSelected: { borderColor: Colors.neutral[900] },
  noneSwatch: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[200],
  },
});
