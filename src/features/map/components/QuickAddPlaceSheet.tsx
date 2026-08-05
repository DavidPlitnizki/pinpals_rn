import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { MoodPicker } from '../../../design-system/components/MoodPicker';
import { PinColorPicker } from '../../../design-system/components/PinColorPicker';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Coordinates, MemoryMood, MOOD_CONFIG } from '../../../models/types';
import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { QuickAddSaveData } from '../hooks/useMapScreen';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.78;
const ANIMATION_DURATION = 280;
const MAX_PHOTOS = 5;
const DEFAULT_RATING = 5;
// The "main" photo (shown on the map pin) is marked with a gold border/badge — distinct
// from every other status color used in this sheet (brand green, error red, warning amber).
const GOLD = '#D4AF37';

interface Props {
  visible: boolean;
  coordinates: Coordinates | null;
  onSave: (data: QuickAddSaveData) => void;
  onClose: () => void;
  onDirections: (name: string) => void;
}

const PhotoThumb = React.memo(function PhotoThumb({
  uri,
  isMain,
  onRemove,
  onSetMain,
}: {
  uri: string;
  isMain: boolean;
  onRemove: (uri: string) => void;
  onSetMain: (uri: string) => void;
}) {
  const handleRemove = useCallback(() => onRemove(uri), [onRemove, uri]);
  const handleLongPress = useCallback(() => onSetMain(uri), [onSetMain, uri]);
  return (
    <TouchableOpacity
      style={styles.photoItem}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={350}
    >
      <Image
        source={{ uri }}
        style={[styles.photoThumb, isMain && styles.photoThumbMain]}
      />
      {isMain && (
        <View style={styles.photoMainBadge}>
          <Ionicons name="star" size={11} color={Colors.white} />
        </View>
      )}
      <TouchableOpacity style={styles.photoRemove} onPress={handleRemove}>
        <Text style={styles.photoRemoveText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// Mirrors SearchSheet's structure deliberately: Modal stays mounted and is toggled via
// `visible`, there is no KeyboardAvoidingView and no animated `height` — those are what
// broke the keyboard here before (see git history). Content just scrolls under the keyboard.
export function QuickAddPlaceSheet({ visible, coordinates, onSave, onClose, onDirections }: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sheetStyle = useMemo(
    () => [styles.sheet, { paddingBottom: insets.bottom + Spacing.s16 }, { transform: [{ translateY }] }],
    [insets.bottom, translateY],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [mood, setMood] = useState<MemoryMood | undefined>(undefined);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [wantToVisit, setWantToVisit] = useState(false);
  const [pinColor, setPinColor] = useState<string | undefined>(undefined);
  const [mainPhotoUri, setMainPhotoUri] = useState<string | undefined>(undefined);

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
    setFavorite(false);
    setWantToVisit(false);
    setPinColor(undefined);
    setMainPhotoUri(undefined);
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
  const animateOut = useCallback(
    (onComplete: () => void) => {
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
    },
    [backdropOpacity, translateY],
  );

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  const handleSavePress = useCallback(() => {
    onSave({
      name,
      description,
      photoUris,
      mood,
      rating,
      favorite,
      wantToVisit,
      pinColor,
      mainPhotoUri,
    });
  }, [
    onSave,
    name,
    description,
    photoUris,
    mood,
    rating,
    favorite,
    wantToVisit,
    pinColor,
    mainPhotoUri,
  ]);

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

  const handleToggleFavorite = useCallback(() => setFavorite((v) => !v), []);
  const handleToggleWantToVisit = useCallback(() => setWantToVisit((v) => !v), []);

  const handleSelectMood = useCallback((selected: MemoryMood) => {
    setMood(selected);
    setMoodPickerOpen(false);
  }, []);

  const handlePickPhotos = useCallback(async () => {
    const remaining = MAX_PHOTOS - photoUris.length;
    if (remaining <= 0) return;

    const source = await promptPhotoSource();
    if (!source) return;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to the camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUris((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to the photo library.');
      return;
    }
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
  }, [photoUris.length]);

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
    setMainPhotoUri((prev) => (prev === uri ? undefined : prev));
  }, []);

  const handleSetMainPhoto = useCallback((uri: string) => {
    setMainPhotoUri((prev) => (prev === uri ? undefined : uri));
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

        <Animated.View style={sheetStyle}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={handleSavePress} hitSlop={8}>
              <Text style={styles.saveLink}>Save</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Pin</Text>
            <CircleCloseButton onPress={handleClose} />
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

            <View style={styles.iconActionRow}>
              <TouchableOpacity style={styles.iconActionButton} onPress={handlePickPhotos}>
                <Ionicons name="camera-outline" size={22} color={Colors.brand.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconActionButton} onPress={handleToggleMoodPicker}>
                <Text style={styles.iconActionButtonEmoji}>
                  {mood ? MOOD_CONFIG[mood].emoji : '🙂'}
                </Text>
              </TouchableOpacity>
            </View>

            {moodPickerOpen && (
              <View style={styles.moodPickerWrap}>
                <MoodPicker selected={mood} onSelect={handleSelectMood} />
              </View>
            )}

            {photoUris.length > 0 && (
              <>
                <View style={styles.photoGrid}>
                  {photoUris.map((uri) => (
                    <PhotoThumb
                      key={uri}
                      uri={uri}
                      isMain={mainPhotoUri === uri}
                      onRemove={handleRemovePhoto}
                      onSetMain={handleSetMainPhoto}
                    />
                  ))}
                </View>
                {photoUris.length > 1 && (
                  <Text style={styles.photoHint}>Hold a photo to set it as the map pin photo</Text>
                )}
              </>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, favorite && styles.actionButtonActive]}
                onPress={handleToggleFavorite}
              >
                <Text style={styles.actionButtonEmoji}>{favorite ? '❤️' : '🤍'}</Text>
                <Text
                  style={[styles.actionButtonText, favorite && styles.actionButtonTextActive]}
                >
                  Favorite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, wantToVisit && styles.actionButtonActive]}
                onPress={handleToggleWantToVisit}
              >
                <Text style={styles.actionButtonEmoji}>{wantToVisit ? '⭐' : '☆'}</Text>
                <Text
                  style={[styles.actionButtonText, wantToVisit && styles.actionButtonTextActive]}
                >
                  Want to visit
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Pin color</Text>
              <PinColorPicker selected={pinColor} onSelect={setPinColor} />
            </View>

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
  actionButtonActive: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.primary,
  },
  actionButtonTextActive: {
    color: Colors.brand.dark,
  },
  actionButtonEmoji: { fontSize: 18 },
  // Icon-only variant (photo/mood toggles) — a fixed-size square instead of the full-width
  // pill used by the labeled favorite/want-to-visit buttons below, since there's no text to
  // stretch for.
  iconActionRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s16,
  },
  iconActionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  iconActionButtonEmoji: { fontSize: 20 },
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
  photoThumbMain: {
    borderWidth: 3,
    borderColor: GOLD,
  },
  photoMainBadge: {
    position: 'absolute',
    bottom: Spacing.s4,
    left: Spacing.s4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  photoHint: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: Spacing.s8,
  },
});
