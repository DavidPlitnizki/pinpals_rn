import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinButton } from '../../../design-system/components/PinButton';
import { PinChip } from '../../../design-system/components/PinChip';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { PinTextField } from '../../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';
import { AddPlaceState } from '../types';

interface Props {
  visible: boolean;
  state: AddPlaceState;
  onChange: (update: Partial<AddPlaceState>) => void;
  onSave: () => void;
  onClose: () => void;
}

export function AddPlaceModal({ visible, state, onChange, onSave, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Place</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <PinTextField
            label="Name"
            value={state.name}
            onChangeText={(t) => onChange({ name: t })}
            placeholder="Place name"
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map((cat) => (
                <PinChip
                  key={cat}
                  label={CATEGORY_LABELS[cat]}
                  color={CATEGORY_COLORS[cat]}
                  selected={state.category === cat}
                  onPress={() => onChange({ category: cat })}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Rating</Text>
            <PinRatingView
              rating={state.rating}
              onRatingChange={(r) => onChange({ rating: r })}
              size={28}
            />
          </View>

          <View style={styles.fieldGroup}>
            <PinTextField
              label="Description (optional)"
              value={state.description}
              onChangeText={(t) => onChange({ description: t })}
              placeholder="What's special about this place?"
              multiline
            />
          </View>

          {state.coordinates && (
            <View style={styles.coordsInfo}>
              <Text style={styles.coordsText}>
                📍 {state.coordinates.latitude.toFixed(4)}, {state.coordinates.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          <View style={styles.saveBtn}>
            <PinButton title="Save Place" onPress={onSave} fullWidth size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  title: { ...Typography.title3, color: Colors.neutral[900] },
  cancel: { ...Typography.body, color: Colors.brand.primary },
  content: { flex: 1, padding: Spacing.s20 },
  fieldGroup: { marginBottom: Spacing.s16 },
  fieldLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    fontWeight: '600',
  },
  chipRow: { flexDirection: 'row', gap: Spacing.s8, paddingVertical: Spacing.s4 },
  coordsInfo: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.sm,
    padding: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  coordsText: { ...Typography.footnote, color: Colors.neutral[600] },
  saveBtn: { marginTop: Spacing.s8, marginBottom: Spacing.s32 },
});
