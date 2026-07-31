import { Ionicons } from '@expo/vector-icons';
import RNSlider from '@react-native-community/slider';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinChip } from '../../../design-system/components/PinChip';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place, PlaceCategory } from '../../../models/types';
import { MapboxSearchResult } from '../../../services/mapboxSearch';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';
import { formatRadius, SpecialFilter } from '../hooks/useSearchSheet';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;
const ANIMATION_DURATION = 280;

interface Props {
  visible: boolean;
  query: string;
  radiusM: number;
  radiusEnabled: boolean;
  maxRadiusM: number;
  activeCategories: Set<PlaceCategory>;
  specialFilters: Set<SpecialFilter>;
  alwaysShowFavorites: boolean;
  filteredPlaces: Place[];
  showExternal: boolean;
  externalResults: MapboxSearchResult[];
  externalLoading: boolean;
  externalSearched: boolean;
  onChangeQuery: (q: string) => void;
  onRadiusChange: (value: number) => void;
  onToggleRadiusEnabled: (enabled: boolean) => void;
  onToggleCategory: (cat: PlaceCategory) => void;
  onToggleSpecial: (filter: SpecialFilter) => void;
  onToggleAlwaysShowFavorites: (enabled: boolean) => void;
  onPlacePress: (placeId: string) => void;
  onExternalResultPress: (result: MapboxSearchResult) => void;
  onSearchExternal: () => void;
  onClose: () => void;
}

export function SearchSheet({
  visible,
  query,
  radiusM,
  radiusEnabled,
  maxRadiusM,
  activeCategories,
  specialFilters,
  alwaysShowFavorites,
  filteredPlaces,
  showExternal,
  externalResults,
  externalLoading,
  externalSearched,
  onChangeQuery,
  onRadiusChange,
  onToggleRadiusEnabled,
  onToggleCategory,
  onToggleSpecial,
  onToggleAlwaysShowFavorites,
  onPlacePress,
  onExternalResultPress,
  onSearchExternal,
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

  function renderPlace(item: Place) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.placeRow}
        onPress={() => {
          handleClose();
          onPlacePress(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.placeMeta}>
            {CATEGORY_LABELS[item.category]}
            {'  '}
            {'★'.repeat(item.rating)}
            {item.isFavorite ? '  ⭐' : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  function renderExternalPlace(item: MapboxSearchResult) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.placeRow}
        onPress={() => {
          handleClose();
          onExternalResultPress(item);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="location-outline" size={20} color={Colors.brand.primary} />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.fullAddress && (
            <Text style={styles.placeMeta} numberOfLines={1}>
              {item.fullAddress}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

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
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Search input */}
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={Colors.neutral[400]} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search your places or find something new…"
              placeholderTextColor={Colors.neutral[400]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            <PinChip
              label="Mine only"
              color={Colors.brand.primary}
              selected={specialFilters.has('mine')}
              onPress={() => onToggleSpecial('mine')}
            />
            <PinChip
              label="⭐ Want to visit"
              color={Colors.warning}
              selected={specialFilters.has('favorites')}
              onPress={() => onToggleSpecial('favorites')}
            />
            {CATEGORIES.map((cat) => (
              <PinChip
                key={cat}
                label={CATEGORY_LABELS[cat]}
                color={CATEGORY_COLORS[cat]}
                selected={activeCategories.has(cat)}
                onPress={() => onToggleCategory(cat)}
              />
            ))}
          </ScrollView>

          {/* Radius slider */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                {radiusEnabled ? `Radius: ${formatRadius(radiusM)}` : 'Radius: off (search anywhere)'}
              </Text>
              <Switch
                value={radiusEnabled}
                onValueChange={onToggleRadiusEnabled}
                trackColor={{ false: Colors.neutral[200], true: Colors.brand.primary }}
                thumbColor={Colors.white}
              />
            </View>
            <RNSlider
              style={styles.sliderHost}
              value={radiusM}
              minimumValue={100}
              maximumValue={maxRadiusM}
              step={100}
              onValueChange={onRadiusChange}
              disabled={!radiusEnabled}
              minimumTrackTintColor={Colors.brand.primary}
              maximumTrackTintColor={Colors.neutral[200]}
              thumbTintColor={Colors.brand.primary}
            />
          </View>

          <View style={styles.favoritesToggleRow}>
            <Text style={styles.favoritesToggleLabel}>
              ⭐ Always show &quot;Want to visit&quot; on map
            </Text>
            <Switch
              value={alwaysShowFavorites}
              onValueChange={onToggleAlwaysShowFavorites}
              trackColor={{ false: Colors.neutral[200], true: Colors.brand.primary }}
              thumbColor={Colors.white}
            />
          </View>

          {showExternal && (
            <TouchableOpacity
              style={[
                styles.searchButton,
                query.trim().length < 2 && activeCategories.size === 0 && styles.searchButtonDisabled,
              ]}
              onPress={onSearchExternal}
              disabled={query.trim().length < 2 && activeCategories.size === 0}
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
          )}

          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>My Places</Text>
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map(renderPlace)
            ) : (
              <Text style={styles.emptyText}>No places match your filters</Text>
            )}

            {showExternal && (
              <>
                <Text style={styles.sectionHeader}>Find New Place</Text>
                {externalLoading ? (
                  <ActivityIndicator style={styles.loadingIndicator} color={Colors.brand.primary} />
                ) : externalResults.length > 0 ? (
                  externalResults.map(renderExternalPlace)
                ) : (
                  <ExternalEmptyState
                    query={query}
                    hasCategory={activeCategories.size > 0}
                    searched={externalSearched}
                  />
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ExternalEmptyState({
  query,
  hasCategory,
  searched,
}: {
  query: string;
  hasCategory: boolean;
  searched: boolean;
}) {
  const message =
    query.trim().length < 2 && !hasCategory
      ? 'Type at least 2 characters or pick a category, then tap Search'
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
  inputIcon: {
    fontSize: 18,
    color: Colors.neutral[400],
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  favoritesToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    gap: Spacing.s8,
  },
  favoritesToggleLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    flex: 1,
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
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s8,
    paddingBottom: Spacing.s8,
  },
  sliderRow: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s8,
  },
  sliderLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s4,
  },
  sliderHost: {
    height: 32,
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
  placeInfo: {
    flex: 1,
  },
  placeName: {
    ...Typography.callout,
    color: Colors.neutral[900],
    fontWeight: '600',
    marginBottom: 2,
  },
  placeMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
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
