import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { PinButton } from '../../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { formatDistance, formatDuration } from '../../../shared/format';
import { RoutePreview, RouteProfile } from '../types';

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
  previews: Partial<Record<RouteProfile, RoutePreview>>;
  hasLocation: boolean;
  loading: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

function ModeOptionButton({
  option,
  selected,
  preview,
  isFastest,
  onSelectProfile,
}: {
  option: ModeOption;
  selected: boolean;
  preview: RoutePreview | undefined;
  isFastest: boolean;
  onSelectProfile: (profile: RouteProfile) => void;
}) {
  const handlePress = useCallback(
    () => onSelectProfile(option.profile),
    [onSelectProfile, option.profile],
  );

  return (
    <TouchableOpacity
      style={[styles.modeOption, selected && styles.modeOptionSelected]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.modeIconRow}>
        <Ionicons
          name={option.icon}
          size={22}
          color={selected ? Colors.white : Colors.brand.primary}
        />
        {isFastest && (
          <View style={styles.fastestBadge}>
            <Ionicons name="flash" size={10} color={Colors.white} />
          </View>
        )}
      </View>
      <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{option.label}</Text>
      {/* Fixed-height slot so the row doesn't reflow as each mode's preview resolves
          independently (loading spinner and success text are the same height, and this
          reserves the same space while still loading). */}
      <View style={styles.previewSlot}>
        {preview?.status === 'loading' && (
          <ActivityIndicator size="small" color={selected ? Colors.white : Colors.brand.primary} />
        )}
        {preview?.status === 'success' &&
          preview.durationSeconds !== undefined &&
          preview.distanceMeters !== undefined && (
            <Text style={[styles.previewText, selected && styles.previewTextSelected]} numberOfLines={1}>
              {formatDuration(preview.durationSeconds)} · {formatDistance(preview.distanceMeters)}
            </Text>
          )}
      </View>
    </TouchableOpacity>
  );
}

export function RouteModePicker({
  visible,
  destinationLabel,
  selectedProfile,
  onSelectProfile,
  previews,
  hasLocation,
  loading,
  errorMessage,
  onConfirm,
  onClose,
}: Props) {
  // Only mark a "fastest" mode once every option has resolved — otherwise the badge would
  // flicker onto whichever mode happens to respond first from the network. Memoized so this
  // filter/reduce chain only re-runs when the previews actually change, not on every render
  // (e.g. typing in an unrelated field elsewhere while this modal is open).
  const fastestProfile = useMemo(() => {
    const successPreviews = MODE_OPTIONS.map((o) => previews[o.profile]).filter(
      (p): p is RoutePreview & { status: 'success' } => p?.status === 'success',
    );
    if (successPreviews.length !== MODE_OPTIONS.length) return null;
    return MODE_OPTIONS.reduce((fastest, option) => {
      const current = previews[option.profile];
      const best = previews[fastest.profile];
      if (
        current?.status === 'success' &&
        (best?.status !== 'success' ||
          (current.durationSeconds ?? Infinity) < (best.durationSeconds ?? Infinity))
      ) {
        return option;
      }
      return fastest;
    }, MODE_OPTIONS[0]).profile;
  }, [previews]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <CircleCloseButton onPress={onClose} style={styles.closeButton} />
              <Text style={styles.title}>Directions</Text>
              <Text style={styles.destination} numberOfLines={1}>
                {destinationLabel}
              </Text>

              <View style={styles.modeRow}>
                {MODE_OPTIONS.map((option) => (
                  <ModeOptionButton
                    key={option.profile}
                    option={option}
                    selected={option.profile === selectedProfile}
                    preview={previews[option.profile]}
                    isFastest={fastestProfile === option.profile}
                    onSelectProfile={onSelectProfile}
                  />
                ))}
              </View>

              {!hasLocation && <Text style={styles.error}>Enable location to get directions</Text>}
              {hasLocation && errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <PinButton title="Cancel" variant="secondary" onPress={onClose} fullWidth />
                </View>
                <View style={styles.actionButton}>
                  <PinButton
                    title={errorMessage ? 'Try again' : 'OK'}
                    onPress={onConfirm}
                    disabled={!hasLocation || loading}
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.s12,
    right: Spacing.s12,
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
  modeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Uses the accent (orange) token rather than brand green or Colors.success — the map
  // screen already uses green for brand/route/mood affordances, amber for native POIs, red
  // for search/clear pills, and blue for the route line, so a highlight badge needs a color
  // outside that set to avoid implying a different meaning.
  fastestBadge: {
    marginLeft: Spacing.s4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Matches the caption line-height (16) so loading/success/empty states all reserve the
  // same row height and the buttons never resize as previews resolve.
  previewSlot: {
    height: Typography.caption.lineHeight,
    justifyContent: 'center',
  },
  previewText: {
    ...Typography.caption,
    color: Colors.brand.primary,
  },
  previewTextSelected: {
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
