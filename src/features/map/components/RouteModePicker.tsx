import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { PinButton } from '../../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { RouteOriginMode, RouteProfile } from '../types';

interface ModeOption {
  profile: RouteProfile;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const MODE_OPTIONS: ModeOption[] = [
  { profile: 'walking', label: 'Walk', icon: 'walk' },
  { profile: 'driving', label: 'Drive', icon: 'car' },
  { profile: 'cycling', label: 'Cycle', icon: 'bicycle' },
];

interface Props {
  visible: boolean;
  destinationLabel: string;
  selectedProfile: RouteProfile;
  onSelectProfile: (profile: RouteProfile) => void;
  originMode: RouteOriginMode;
  originLabel: string;
  onSelectGpsOrigin: () => void;
  onOpenPlacePicker: () => void;
  hasLocation: boolean;
  hasOrigin: boolean;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function RouteModePicker({
  visible,
  destinationLabel,
  selectedProfile,
  onSelectProfile,
  originMode,
  originLabel,
  onSelectGpsOrigin,
  onOpenPlacePicker,
  hasLocation,
  hasOrigin,
  loading,
  errorMessage,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Directions</Text>
              <Text style={styles.destination} numberOfLines={1}>
                {destinationLabel}
              </Text>

              <View style={styles.modeRow}>
                {MODE_OPTIONS.map((option) => {
                  const selected = option.profile === selectedProfile;
                  return (
                    <TouchableOpacity
                      key={option.profile}
                      style={[styles.modeOption, selected && styles.modeOptionSelected]}
                      onPress={() => onSelectProfile(option.profile)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={selected ? Colors.white : Colors.brand.primary}
                      />
                      <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.originHeader}>Start from</Text>
              <View style={styles.originRow}>
                <TouchableOpacity
                  style={[styles.originOption, originMode === 'gps' && styles.originOptionSelected]}
                  onPress={onSelectGpsOrigin}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="navigate"
                    size={16}
                    color={originMode === 'gps' ? Colors.white : Colors.brand.primary}
                  />
                  <Text
                    style={[styles.originLabel, originMode === 'gps' && styles.originLabelSelected]}
                    numberOfLines={1}
                  >
                    My location
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.originOption, originMode === 'place' && styles.originOptionSelected]}
                  onPress={onOpenPlacePicker}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={originMode === 'place' ? Colors.white : Colors.brand.primary}
                  />
                  <Text
                    style={[styles.originLabel, originMode === 'place' && styles.originLabelSelected]}
                    numberOfLines={1}
                  >
                    {originMode === 'place' ? originLabel : 'Choose a place'}
                  </Text>
                </TouchableOpacity>
              </View>

              {originMode === 'gps' && !hasLocation && (
                <Text style={styles.error}>Enable location to get directions</Text>
              )}
              {originMode === 'place' && !hasOrigin && (
                <Text style={styles.error}>Choose a place to start from</Text>
              )}
              {hasOrigin && errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <PinButton title="Cancel" variant="secondary" onPress={onClose} fullWidth />
                </View>
                <View style={styles.actionButton}>
                  <PinButton
                    title={errorMessage ? 'Try again' : 'OK'}
                    onPress={onConfirm}
                    disabled={!hasOrigin || loading}
                    loading={loading}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.s20,
  },
  title: { ...Typography.title3, color: Colors.neutral[900] },
  destination: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    marginTop: Spacing.s4,
    marginBottom: Spacing.s16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.s4,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  modeOptionSelected: {
    backgroundColor: Colors.brand.primary,
  },
  modeLabel: {
    ...Typography.caption,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  modeLabelSelected: {
    color: Colors.white,
  },
  originHeader: {
    ...Typography.caption,
    color: Colors.neutral[500],
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: Spacing.s16,
    marginBottom: Spacing.s8,
  },
  originRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  originOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s4,
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s8,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  originOptionSelected: {
    backgroundColor: Colors.brand.primary,
  },
  originLabel: {
    ...Typography.caption,
    color: Colors.brand.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  originLabelSelected: {
    color: Colors.white,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.s16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s20,
  },
  actionButton: { flex: 1 },
});
