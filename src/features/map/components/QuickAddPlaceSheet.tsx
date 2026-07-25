import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodPicker } from '../../../design-system/components/MoodPicker';
import { PinButton } from '../../../design-system/components/PinButton';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { PinTextField } from '../../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { QuickAddPlaceState } from '../types';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;
const ANIMATION_DURATION = 280;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateLabel} · ${timeLabel}`;
}

interface Props {
  visible: boolean;
  state: QuickAddPlaceState;
  onChange: (update: Partial<QuickAddPlaceState>) => void;
  onPickPhotos: () => void;
  onRemovePhoto: (uri: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function QuickAddPlaceSheet({
  visible,
  state,
  onChange,
  onPickPhotos,
  onRemovePhoto,
  onSave,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      translateY.setValue(SHEET_HEIGHT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  }

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.s16 },
          { transform: [{ translateY }] },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>New Pin</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <PinTextField
              label="Name"
              value={state.name}
              onChangeText={(t) => onChange({ name: t })}
              placeholder="Place name"
            />
            <Text style={styles.secondaryText}>{formatDateTime(state.createdAt)}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Photos</Text>
              <View style={styles.photoGrid}>
                {state.photoUris.map((uri) => (
                  <View key={uri} style={styles.photoItem}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => onRemovePhoto(uri)}>
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {state.photoUris.length < 5 && (
                  <TouchableOpacity style={styles.photoAdd} onPress={onPickPhotos}>
                    <Text style={styles.photoAddIcon}>📷</Text>
                    <Text style={styles.photoAddText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mood</Text>
              <View style={styles.moodPickerWrap}>
                <MoodPicker selected={state.mood} onSelect={(mood) => onChange({ mood })} />
              </View>
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
              {state.coordinates && (
                <Text style={styles.secondaryText}>
                  📍 {state.coordinates.latitude.toFixed(4)},{' '}
                  {state.coordinates.longitude.toFixed(4)}
                </Text>
              )}
            </View>

            <View style={styles.saveBtn}>
              <PinButton title="Save Place" onPress={onSave} fullWidth size="lg" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.s12,
    paddingBottom: Spacing.s8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
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
  secondaryText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.s4,
    marginBottom: Spacing.s16,
  },
  moodPickerWrap: { marginHorizontal: -Spacing.s20 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  photoItem: { position: 'relative', width: 100 },
  photoThumb: { width: 100, height: 100, borderRadius: Radii.md },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.s4,
  },
  photoAddIcon: { fontSize: 24 },
  photoAddText: { ...Typography.caption, color: Colors.text.secondary },
  saveBtn: { marginTop: Spacing.s8, marginBottom: Spacing.s32 },
});
