import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
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

const WINDOW_HEIGHT = Dimensions.get('window').height;
const DEFAULT_SHEET_RATIO = 0.5;
const SNAP_RATIOS = [0.25, 0.5, 1];
const MIN_DRAG_HEIGHT = WINDOW_HEIGHT * 0.14;
const MAX_SHEET_HEIGHT = WINDOW_HEIGHT * SNAP_RATIOS[SNAP_RATIOS.length - 1];
const CLOSE_HEIGHT_THRESHOLD = WINDOW_HEIGHT * 0.18;
const CLOSE_VELOCITY_THRESHOLD = 1.1;
const ANIMATION_DURATION = 280;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nearestSnapHeight(height: number): number {
  return SNAP_RATIOS.map((r) => r * WINDOW_HEIGHT).reduce((closest, candidate) =>
    Math.abs(candidate - height) < Math.abs(closest - height) ? candidate : closest,
  );
}

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
  onDirections: () => void;
}

export function QuickAddPlaceSheet({
  visible,
  state,
  onChange,
  onPickPhotos,
  onRemovePhoto,
  onSave,
  onClose,
  onDirections,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const sheetHeight = useRef(new Animated.Value(WINDOW_HEIGHT * DEFAULT_SHEET_RATIO)).current;
  const heightAtGestureStart = useRef(WINDOW_HEIGHT * DEFAULT_SHEET_RATIO);

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
      translateY.setValue(WINDOW_HEIGHT);
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
        toValue: WINDOW_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      sheetHeight.setValue(WINDOW_HEIGHT * DEFAULT_SHEET_RATIO);
      onClose();
    });
  }

  function animateToHeight(height: number) {
    Animated.spring(sheetHeight, {
      toValue: height,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          heightAtGestureStart.current = value;
        });
      },
      onPanResponderMove: (_evt, gesture) => {
        const nextHeight = clamp(
          heightAtGestureStart.current - gesture.dy,
          MIN_DRAG_HEIGHT,
          MAX_SHEET_HEIGHT,
        );
        sheetHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const releasedHeight = heightAtGestureStart.current - gesture.dy;
        const draggingDown = gesture.dy > 0;
        if (
          draggingDown &&
          (releasedHeight < CLOSE_HEIGHT_THRESHOLD || gesture.vy > CLOSE_VELOCITY_THRESHOLD)
        ) {
          handleClose();
          return;
        }
        const clampedHeight = clamp(releasedHeight, MIN_DRAG_HEIGHT, MAX_SHEET_HEIGHT);
        animateToHeight(nearestSnapHeight(clampedHeight));
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.slideWrap, { transform: [{ translateY }] }]}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.s16 },
            { height: sheetHeight },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>New Pin</Text>
                <TouchableOpacity onPress={handleClose} hitSlop={8}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
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

              {state.coordinates && (
                <View style={styles.coordsRow}>
                  <Text style={styles.coordsText}>
                    📍 {state.coordinates.latitude.toFixed(4)},{' '}
                    {state.coordinates.longitude.toFixed(4)}
                  </Text>
                  <TouchableOpacity onPress={onDirections} hitSlop={8}>
                    <Text style={styles.directionsLink}>Get directions</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Photos</Text>
                <View style={styles.photoGrid}>
                  {state.photoUris.map((uri) => (
                    <View key={uri} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => onRemovePhoto(uri)}
                      >
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
              </View>

              <View style={styles.saveBtn}>
                <PinButton title="Save Place" onPress={onSave} fullWidth size="lg" />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
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
  slideWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    maxHeight: MAX_SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    overflow: 'hidden',
  },
  dragArea: {
    // Larger hit area than the visual handle so the whole grip zone is easy to grab.
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
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s16,
  },
  coordsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  directionsLink: {
    ...Typography.caption,
    color: Colors.brand.primary,
    fontWeight: '600',
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
