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
import { MapboxSuggestion } from '../../../services/mapboxSearch';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { categoryColor } from '../constants';
import { MIN_EXTERNAL_QUERY_LENGTH } from '../hooks/useSearchSheet';
import { getPlacePhotoPreview } from '../utils/placePhoto';

const SHEET_HEIGHT = Dimensions.get('window').height;
const ANIMATION_DURATION = 280;

function formatSavedAt(createdAt: string): string {
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
        <View style={[styles.categoryDot, { backgroundColor: categoryColor(place.category) }]} />
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.placeMeta}>{'★'.repeat(place.rating)}</Text>
        <Text style={styles.placeSavedAt}>Saved {formatSavedAt(place.createdAt)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
});

interface SuggestionRowProps {
  suggestion: MapboxSuggestion;
  // The row that's being resolved shows a spinner in place of its chevron — retrieve is a
  // network round-trip, and without it a tap looks like it did nothing.
  retrieving: boolean;
  onPress: (suggestion: MapboxSuggestion) => void;
}

const SuggestionRow = React.memo(function SuggestionRow({
  suggestion,
  retrieving,
  onPress,
}: SuggestionRowProps) {
  const handlePress = useCallback(() => onPress(suggestion), [onPress, suggestion]);

  return (
    <TouchableOpacity style={styles.placeRow} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name="location-outline" size={20} color={Colors.brand.primary} />
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {suggestion.name}
        </Text>
        {suggestion.placeFormatted && (
          <Text style={styles.placeMeta} numberOfLines={1}>
            {suggestion.placeFormatted}
          </Text>
        )}
      </View>
      {retrieving ? (
        <ActivityIndicator size="small" color={Colors.brand.primary} />
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
});

interface Props {
  visible: boolean;
  query: string;
  filteredPlaces: Place[];
  suggestions: MapboxSuggestion[];
  externalLoading: boolean;
  externalSearched: boolean;
  onChangeQuery: (q: string) => void;
  onPlacePress: (placeId: string) => void;
  retrievingId: string | null;
  // Resolves true once the suggestion became a real place — the sheet closes on that, and
  // stays open (with the query intact) if the lookup failed.
  onSuggestionPress: (suggestion: MapboxSuggestion) => Promise<boolean>;
  onClose: () => void;
}

// Stripped to exactly what Google/Apple Maps' full-screen search shows: an input, the
// "search" action, and results — no filter chips, tabs, or toggles.
export function SearchSheet({
  visible,
  query,
  filteredPlaces,
  suggestions,
  externalLoading,
  externalSearched,
  onChangeQuery,
  onPlacePress,
  retrievingId,
  onSuggestionPress,
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

  const handleSelectSuggestion = useCallback(
    async (suggestion: MapboxSuggestion) => {
      const resolved = await onSuggestionPress(suggestion);
      if (resolved) handleClose();
    },
    [handleClose, onSuggestionPress],
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
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

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

            <View style={styles.externalHeaderRow}>
              <Text style={styles.sectionHeader}>Find New Place</Text>
              {/* Inline, not in place of the list: suggestions refresh on every keystroke, and
                  swapping the whole section for a spinner made it flash on each one. */}
              {externalLoading && suggestions.length > 0 && (
                <ActivityIndicator size="small" color={Colors.neutral[400]} />
              )}
            </View>
            {externalLoading && suggestions.length === 0 ? (
              <ActivityIndicator style={styles.loadingIndicator} color={Colors.brand.primary} />
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <SuggestionRow
                  key={suggestion.mapboxId}
                  suggestion={suggestion}
                  retrieving={retrievingId === suggestion.mapboxId}
                  onPress={handleSelectSuggestion}
                />
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
      ? 'Type at least 2 characters to see suggestions'
      : searched
        ? 'No results found'
        : 'Searching…';
  return <Text style={styles.emptyText}>{message}</Text>;
}

const styles = StyleSheet.create({
  externalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
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
