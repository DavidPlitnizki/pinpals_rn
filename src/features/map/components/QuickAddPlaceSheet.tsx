import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodPicker } from '../../../design-system/components/MoodPicker';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Coordinates, MemoryMood, MOOD_CONFIG } from '../../../models/types';
import { QuickAddSaveData } from '../hooks/useMapScreen';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.78;
const ANIMATION_DURATION = 280;
const MAX_PHOTOS = 5;
const DEFAULT_RATING = 5;

interface Props {
  visible: boolean;
  coordinates: Coordinates | null;
  onSave: (data: QuickAddSaveData) => void;
  onClose: () => void;
  onDirections: (name: string) => void;
}

// Mirrors SearchSheet's structure deliberately: Modal stays mounted and is toggled via
// `visible`, there is no KeyboardAvoidingView and no animated `height` — those are what
// broke the keyboard here before (see git history). Content just scrolls under the keyboard.
export function QuickAddPlaceSheet({ visible, coordinates, onSave, onClose, onDirections }: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [mood, setMood] = useState<MemoryMood | undefined>(undefined);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);

  const wasVisibleRef = useRef(visible);
  // Reset to a clean form synchronously during render on the closed->open transition
  // (React's "adjusting state during render" pattern), rather than in an effect — avoids an
  // extra render pass right as the sheet appears.
  if (visible && !wasVisibleRef.current) {
    setName('');
    setDescription('');
    setPhotoUris([]);
    setMood(undefined);
    setRating(DEFAULT_RATING);
    setMoodPickerOpen(false);
  }
  wasVisibleRef.current = visible;

  // Temporary diagnostic logging — same keyboard bug reported in the prior build of this
  // sheet. This build's only remaining untested difference from the working SearchSheet is
  // the ScrollView-nested layout; the PinTextField-vs-bare-TextInput variable has now been
  // eliminated too. Remove once confirmed fixed (or once these logs point somewhere new).
  useEffect(() => {
    if (!visible) return undefined;
    const subs = [
      Keyboard.addListener('keyboardWillShow', (e) =>
        console.log('[QuickAddPlaceSheet] keyboardWillShow', e.endCoordinates.height),
      ),
      Keyboard.addListener('keyboardDidShow', (e) =>
        console.log('[QuickAddPlaceSheet] keyboardDidShow', e.endCoordinates.height),
      ),
      Keyboard.addListener('keyboardWillHide', () =>
        console.log('[QuickAddPlaceSheet] keyboardWillHide'),
      ),
      Keyboard.addListener('keyboardDidHide', () =>
        console.log('[QuickAddPlaceSheet] keyboardDidHide'),
      ),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [visible]);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Two native Modals open at once (this sheet + RouteModePicker) leaves iOS's touch-
  // responder chain broken after both dismiss, freezing the map underneath — the same
  // failure mode documented earlier for the routing feature's origin-picker. Every path
  // that leads to another Modal opening must fully animate this one out and call onClose
  // first, so only one is ever presented at a time.
  function animateOut(onComplete: () => void) {
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
    ]).start(onComplete);
  }

  function handleClose() {
    animateOut(onClose);
  }

  const handleSavePress = useCallback(() => {
    onSave({ name, description, photoUris, mood, rating });
  }, [onSave, name, description, photoUris, mood, rating]);

  const handleDirectionsPress = useCallback(() => {
    animateOut(() => {
      onClose();
      // React batches these two state updates (this sheet -> hidden, RouteModePicker ->
      // visible) into one commit, but the underlying native Modal present/dismiss calls
      // aren't guaranteed to serialize just because the JS state did — one frame's grace
      // lets this sheet's native dismiss land before the next Modal presents.
      requestAnimationFrame(() => onDirections(name));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, onDirections, name]);

  const handleToggleMoodPicker = useCallback(() => setMoodPickerOpen((open) => !open), []);

  const handleSelectMood = useCallback((selected: MemoryMood) => {
    setMood(selected);
    setMoodPickerOpen(false);
  }, []);

  async function handlePickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to the photo library.');
      return;
    }
    const remaining = MAX_PHOTOS - photoUris.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  }

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
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
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={handleSavePress} hitSlop={8}>
              <Text style={styles.saveLink}>Save</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Pin</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {coordinates && (
              <View style={styles.coordsRow}>
                <Text style={styles.coordsText}>
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </Text>
                <TouchableOpacity onPress={handleDirectionsPress} hitSlop={8}>
                  <Text style={styles.directionsLink}>Get directions</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bare TextInput, matching SearchSheet's (the one input in this app whose
              keyboard reliably works) exact pattern — no PinTextField wrapper, which owns
              its own focus-driven internal state and re-renders on every focus/blur. That
              re-render was never isolated as a variable in the earlier keyboard debugging;
              this rules it in or out. */}
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Place name"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <View style={[styles.inputWrap, styles.descriptionWrap]}>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's special about this place?"
                  placeholderTextColor={Colors.neutral[400]}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handlePickPhotos}>
                <Ionicons name="camera-outline" size={20} color={Colors.brand.primary} />
                <Text style={styles.actionButtonText}>Add photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleToggleMoodPicker}>
                <Text style={styles.actionButtonEmoji}>{mood ? MOOD_CONFIG[mood].emoji : '🙂'}</Text>
                <Text style={styles.actionButtonText}>
                  {mood ? MOOD_CONFIG[mood].label : 'Add mood'}
                </Text>
              </TouchableOpacity>
            </View>

            {moodPickerOpen && (
              <View style={styles.moodPickerWrap}>
                <MoodPicker selected={mood} onSelect={handleSelectMood} />
              </View>
            )}

            {photoUris.length > 0 && (
              <View style={styles.photoGrid}>
                {photoUris.map((uri) => (
                  <View key={uri} style={styles.photoItem}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => handleRemovePhoto(uri)}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rating</Text>
              <PinRatingView rating={rating} onRatingChange={setRating} size={28} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
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
  saveLink: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.s20 },
  fieldGroup: { marginTop: Spacing.s16 },
  fieldLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    borderColor: Colors.neutral[200],
    borderWidth: 1,
  },
  descriptionWrap: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  descriptionInput: {
    minHeight: 140,
    paddingVertical: Spacing.s4,
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  actionButtonText: {
    ...Typography.subheadline,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  actionButtonEmoji: { fontSize: 18 },
  moodPickerWrap: {
    marginTop: Spacing.s12,
    marginHorizontal: -Spacing.s20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
    marginTop: Spacing.s16,
  },
  photoItem: { position: 'relative', width: 90 },
  photoThumb: { width: 90, height: 90, borderRadius: Radii.md },
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
});
