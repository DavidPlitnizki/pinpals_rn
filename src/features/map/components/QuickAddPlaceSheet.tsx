import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { FLAG_FAVORITE_COLOR, FLAG_WANT_COLOR } from '../../../design-system/components/PlaceFlags';
import { MapDataAttribution } from '../../../design-system/components/MapDataAttribution';
import { useCoverImage } from '../../../hooks/usePlaceCoverImage';
import { useReverseGeocodedAddress } from '../../../hooks/useReverseGeocodedAddress';
import { MoodPicker } from '../../../design-system/components/MoodPicker';
import { PinColorPicker } from '../../../design-system/components/PinColorPicker';
import { PinRatingView } from '../../../design-system/components/PinRatingView';
import { TagPicker } from '../../../design-system/components/TagPicker';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Coordinates, MemoryMood, MOOD_CONFIG } from '../../../models/types';
import { PRESET_TAGS } from '../../../shared/constants';
import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { HIT_SLOP_8 } from '../constants';
import { QuickAddSaveData } from '../hooks/useMapScreen';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.78;
const ANIMATION_DURATION = 280;
const MAX_PHOTOS = 5;
const DEFAULT_RATING = 5;
// The "main" photo (shown on the map pin) is marked with a gold border/badge — distinct
// from every other status color used in this sheet (brand green, error red, warning amber).
const GOLD = '#D4AF37';
// The cover hook needs a coordinate even while the sheet is closed (hooks can't be skipped);
// its result isn't rendered in that state.
const FALLBACK_COORDS = { latitude: 0, longitude: 0 };

interface Props {
  visible: boolean;
  coordinates: Coordinates | null;
  // Phone as the map knows it (search results carry one) — seeds the field, still editable.
  suggestedPhone?: string;
  // Photo the map already has for this spot (search results carry one); when absent the
  // preview falls back to a crop of the map itself.
  suggestedImageUrl?: string;
  // Name and address as the map itself knows them (basemap POI / search result), used to
  // seed the form — the user can still overwrite the name before saving.
  suggestedName?: string;
  address?: string;
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
      <Image source={{ uri }} style={[styles.photoThumb, isMain && styles.photoThumbMain]} />
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
export function QuickAddPlaceSheet({
  visible,
  coordinates,
  suggestedPhone,
  suggestedImageUrl,
  suggestedName,
  address,
  onSave,
  onClose,
  onDirections,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sheetShadowStyle = useMemo(
    () => [styles.sheetShadow, { transform: [{ translateY }] }],
    [translateY],
  );
  const sheetInnerStyle = useMemo(
    () => [styles.sheetInner, { paddingBottom: insets.bottom + Spacing.s16 }],
    [insets.bottom],
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
  const [tags, setTags] = useState<string[]>([]);
  const [phone, setPhone] = useState('');

  // Real photo if the map has one for this spot, otherwise a Wikipedia lead image, otherwise
  // a crop of the map centred on the pin — never an empty box.
  const cover = useCoverImage(coordinates ?? FALLBACK_COORDS, {
    localPhotoUri: suggestedImageUrl,
    wikipedia: !suggestedImageUrl,
  });

  // A POI or search result arrives with its address already; a point long-pressed on a plain
  // street doesn't, and raw coordinates say nothing about where it is — so look it up.
  const resolvedAddress = useReverseGeocodedAddress(coordinates, address);

  const wasVisibleRef = useRef(visible);
  // Reset to a clean form synchronously during render on the closed->open transition
  // (React's "adjusting state during render" pattern), rather than in an effect — avoids an
  // extra render pass right as the sheet appears.
  if (visible && !wasVisibleRef.current) {
    setName(suggestedName ?? '');
    setDescription('');
    setPhotoUris([]);
    setMood(undefined);
    setRating(DEFAULT_RATING);
    setMoodPickerOpen(false);
    setFavorite(false);
    setWantToVisit(false);
    setPinColor(undefined);
    setMainPhotoUri(undefined);
    setTags([]);
    setPhone(suggestedPhone ?? '');
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
      tags,
      phone: phone.trim() || undefined,
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
    tags,
    phone,
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

  const handleToggleTag = useCallback((tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

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

        <Animated.View style={sheetShadowStyle}>
          <View style={sheetInnerStyle}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleSavePress}
                hitSlop={HIT_SLOP_8}
                style={styles.saveButton}
                accessibilityLabel="Save place"
              >
                <Ionicons name="checkmark" size={20} color={Colors.white} />
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
                <View style={styles.locationRow}>
                  <View style={styles.locationTextCol}>
                    {suggestedName ? (
                      <Text style={styles.locationName} numberOfLines={1}>
                        {suggestedName}
                      </Text>
                    ) : null}
                    {resolvedAddress ? (
                      <Text style={styles.addressText} numberOfLines={2}>
                        📍 {resolvedAddress}
                      </Text>
                    ) : null}
                    <Text style={styles.coordsText}>
                      {resolvedAddress ? '' : '📍 '}
                      {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleDirectionsPress} hitSlop={8}>
                    <Text style={styles.directionsLink}>Get directions</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Cover + the user's own photos/mood, right under the location line: what this
                  place looks like is the first thing worth seeing, before any typing. */}
              {coordinates && (
                <View style={styles.previewBlock}>
                  <View style={styles.coverWrap}>
                    {cover.loading ? (
                      <ActivityIndicator color={Colors.brand.primary} />
                    ) : cover.uri ? (
                      <>
                        <Image source={{ uri: cover.uri }} style={styles.coverImage} />
                        {cover.source === 'mapbox' && <MapDataAttribution />}
                      </>
                    ) : (
                      <Ionicons name="map-outline" size={28} color={Colors.neutral[400]} />
                    )}
                  </View>

                  <View style={styles.iconActionRow}>
                    <TouchableOpacity style={styles.iconActionButton} onPress={handlePickPhotos}>
                      <Ionicons name="camera-outline" size={26} color={Colors.brand.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconActionButton}
                      onPress={handleToggleMoodPicker}
                    >
                      <Text style={styles.iconActionButtonEmoji}>
                        {mood ? MOOD_CONFIG[mood].emoji : '🙂'}
                      </Text>
                    </TouchableOpacity>

                    {/* Same square as the photo/mood buttons and the same gap, so the four
                        controls read as one row rather than two unrelated groups. */}
                    <TouchableOpacity
                      style={[styles.iconActionButton, favorite && styles.iconActionButtonFav]}
                      onPress={handleToggleFavorite}
                      accessibilityLabel="Favorite"
                      accessibilityState={{ selected: favorite }}
                    >
                      <Ionicons
                        name={favorite ? 'heart' : 'heart-outline'}
                        size={26}
                        color={favorite ? Colors.white : FLAG_FAVORITE_COLOR}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconActionButton, wantToVisit && styles.iconActionButtonWant]}
                      onPress={handleToggleWantToVisit}
                      accessibilityLabel="Want to visit"
                      accessibilityState={{ selected: wantToVisit }}
                    >
                      <Ionicons
                        name={wantToVisit ? 'bookmark' : 'bookmark-outline'}
                        size={26}
                        color={wantToVisit ? Colors.white : FLAG_WANT_COLOR}
                      />
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
                        <Text style={styles.photoHint}>
                          Hold a photo to set it as the map pin photo
                        </Text>
                      )}
                    </>
                  )}
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

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    placeholderTextColor={Colors.neutral[400]}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Rating</Text>
                <PinRatingView rating={rating} onRatingChange={setRating} size={28} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Pin color</Text>
                <PinColorPicker selected={pinColor} onSelect={setPinColor} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tags</Text>
                <TagPicker tags={tags} options={PRESET_TAGS} onToggle={handleToggleTag} />
              </View>
            </ScrollView>
          </View>
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
  // Shadow lives on this outer wrapper — a sibling `overflow: hidden` on the same view
  // would clip the shadow along with the content, since iOS clips CALayer shadows too.
  sheetShadow: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  sheetInner: {
    flex: 1,
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
  // Mirrors CircleCloseButton's shape on the opposite side of the header, filled in brand
  // green so the confirming action still reads as the primary one.
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s16,
    gap: Spacing.s8,
  },
  locationTextCol: {
    flex: 1,
    gap: Spacing.s2,
  },
  locationName: {
    ...Typography.subheadline,
    color: Colors.neutral[900],
    fontWeight: '700',
  },
  addressText: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    fontWeight: '600',
    lineHeight: 20,
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
  // Icon-only variant (photo/mood toggles) — a fixed-size square instead of the full-width
  // pill used by the labeled favorite/want-to-visit buttons below, since there's no text to
  // stretch for.
  previewBlock: {
    marginBottom: Spacing.s20,
  },
  coverWrap: {
    width: '100%',
    height: 160,
    borderRadius: Radii.md,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  iconActionRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s12,
  },
  iconActionButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  iconActionButtonEmoji: { fontSize: 26 },
  iconActionButtonFav: {
    backgroundColor: FLAG_FAVORITE_COLOR,
    borderColor: FLAG_FAVORITE_COLOR,
  },
  iconActionButtonWant: {
    backgroundColor: FLAG_WANT_COLOR,
    borderColor: FLAG_WANT_COLOR,
  },
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
