import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place } from '../../../models/types';
import { MapboxSearchResult } from '../../../services/mapboxSearch';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';
import { MIN_EXTERNAL_QUERY_LENGTH } from '../hooks/useSearchSheet';
import { getPlacePhotoPreview } from '../utils/placePhoto';

const SHEET_HEIGHT = Dimensions.get('window').height;
const ANIMATION_DURATION = 280;

function formatSavedAt(createdAt: string): string {
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
}

interface SearchPlaceRowProps {
  place: Place;
  photoUri: string | undefined;
  onPress: (id: string) => void;
}

const SearchPlaceRow = React.memo(function SearchPlaceRow({
  place,
  photoUri,
  onPress,
}: SearchPlaceRowProps) {
  const handlePress = useCallback(() => onPress(place.id), [onPress, place.id]);

  return (
    <TouchableOpacity style={styles.placeRow} onPress={handlePress} activeOpacity={0.7}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.rowThumb} contentFit="cover" />
      ) : (
        <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[place.category] }]} />
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.placeMeta}>
          {CATEGORY_LABELS[place.category]}
          {'  '}
          {'★'.repeat(place.rating)}
          {place.isFavorite ? '  ⭐' : ''}
        </Text>
        <Text style={styles.placeSavedAt}>Saved {formatSavedAt(place.createdAt)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
});

interface ExternalPlaceRowProps {
  result: MapboxSearchResult;
  onPress: (result: MapboxSearchResult) => void;
}

const ExternalPlaceRow = React.memo(function ExternalPlaceRow({
  result,
  onPress,
}: ExternalPlaceRowProps) {
  const handlePress = useCallback(() => onPress(result), [onPress, result]);

  return (
    <TouchableOpacity style={styles.placeRow} onPress={handlePress} activeOpacity={0.7}>
      {result.imageUrl ? (
        <Image source={{ uri: result.imageUrl }} style={styles.rowThumb} contentFit="cover" />
      ) : (
        <Ionicons name="location-outline" size={20} color={Colors.brand.primary} />
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {result.name}
        </Text>
        {result.fullAddress && (
          <Text style={styles.placeMeta} numberOfLines={1}>
            {result.fullAddress}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
});

interface Props {
  visible: boolean;
  query: string;
  filteredPlaces: Place[];
  externalResults: MapboxSearchResult[];
  externalLoading: boolean;
  externalSearched: boolean;
  onChangeQuery: (q: string) => void;
  onPlacePress: (placeId: string) => void;
  onExternalResultPress: (result: MapboxSearchResult) => void;
  onSearchExternal: () => void;
  onClose: () => void;
}

// Stripped to exactly what Google/Apple Maps' full-screen search shows: an input, the
// "search" action, and results — no filter chips, tabs, or toggles.
export function SearchSheet({
  visible,
  query,
  filteredPlaces,
  externalResults,
  externalLoading,
  externalSearched,
  onChangeQuery,
  onPlacePress,
  onExternalResultPress,
  onSearchExternal,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);

  const notes = usePlacesStore((s) => s.notes);
  const photoPreviews = useMemo(() => {
    const map = new Map<string, string>();
    for (const place of filteredPlaces) {
      const preview = getPlacePhotoPreview(place, notes);
      if (preview) map.set(place.id, preview.photoUri);
    }
    return map;
  }, [filteredPlaces, notes]);

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
      // Full-screen search only makes sense as a typing surface — focus the field once the
      // slide-up animation has mostly finished, matching Google/Apple Maps' search modal.
      const focusTimer = setTimeout(() => inputRef.current?.focus(), ANIMATION_DURATION);
      return () => clearTimeout(focusTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = useCallback(() => {
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
  }, [backdropOpacity, translateY, onClose]);

  const handleSelectPlace = useCallback(
    (id: string) => {
      handleClose();
      onPlacePress(id);
    },
    [handleClose, onPlacePress],
  );

  const handleSelectExternal = useCallback(
    (result: MapboxSearchResult) => {
      handleClose();
      onExternalResultPress(result);
    },
    [handleClose, onExternalResultPress],
  );

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
            { paddingTop: insets.top + Spacing.s12, paddingBottom: insets.bottom + Spacing.s16 },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Search input — the back chevron doubles as the modal's only close affordance */}
          <View style={styles.inputWrap}>
            <TouchableOpacity onPress={handleClose} hitSlop={styles.backHitSlop}>
              <Ionicons name="arrow-back" size={20} color={Colors.neutral[700]} />
            </TouchableOpacity>
            <Ionicons name="search" size={18} color={Colors.neutral[400]} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search your places or find something new…"
              placeholderTextColor={Colors.neutral[400]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              query.trim().length < MIN_EXTERNAL_QUERY_LENGTH && styles.searchButtonDisabled,
            ]}
            onPress={onSearchExternal}
            disabled={query.trim().length < MIN_EXTERNAL_QUERY_LENGTH}
            activeOpacity={0.85}
          >
            {externalLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="search" size={18} color={Colors.white} />
                <Text style={styles.searchButtonText}>Search for new places</Text>
              </>
            )}
          </TouchableOpacity>

          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>My Places</Text>
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <SearchPlaceRow
                  key={place.id}
                  place={place}
                  photoUri={photoPreviews.get(place.id)}
                  onPress={handleSelectPlace}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No places match your search</Text>
            )}

            <Text style={styles.sectionHeader}>Find New Place</Text>
            {externalLoading ? (
              <ActivityIndicator style={styles.loadingIndicator} color={Colors.brand.primary} />
            ) : externalResults.length > 0 ? (
              externalResults.map((result) => (
                <ExternalPlaceRow key={result.id} result={result} onPress={handleSelectExternal} />
              ))
            ) : (
              <ExternalEmptyState query={query} searched={externalSearched} />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ExternalEmptyState({ query, searched }: { query: string; searched: boolean }) {
  const message =
    query.trim().length < MIN_EXTERNAL_QUERY_LENGTH
      ? 'Type at least 2 characters, then tap Search'
      : searched
        ? 'No results found'
        : 'Tap Search to find a place';
  return <Text style={styles.emptyText}>{message}</Text>;
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
    backgroundColor: Colors.background,
  },
  backHitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    backgroundColor: Colors.neutral[50],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    gap: Spacing.s8,
    borderColor: Colors.brand.primary,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s12,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    ...Typography.callout,
    color: Colors.white,
    fontWeight: '600',
  },
  sectionHeader: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: Spacing.s12,
    marginBottom: Spacing.s4,
  },
  loadingIndicator: {
    marginVertical: Spacing.s16,
  },
  list: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s24,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    gap: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  rowThumb: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    flexShrink: 0,
    backgroundColor: Colors.neutral[100],
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    ...Typography.callout,
    color: Colors.neutral[900],
    fontWeight: '600',
    marginBottom: Spacing.s2,
  },
  placeMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  placeSavedAt: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: Spacing.s2,
  },
  chevron: {
    fontSize: 20,
    color: Colors.neutral[300],
    lineHeight: 24,
  },
  listContainer: {
    flex: 1,
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
    paddingVertical: Spacing.s16,
    textAlign: 'center',
  },
});
