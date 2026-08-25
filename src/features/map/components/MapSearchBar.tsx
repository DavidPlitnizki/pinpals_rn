import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { CurrentWeather } from '../../../services/weather';
import {
  HIT_SLOP_8,
  MAP_SEARCH_PILL_TOP,
  QUICK_SEARCH_CATEGORIES,
  QuickSearchCategory,
} from '../constants';
import { colorForWeatherCode, iconForWeatherCode } from '../utils/weatherIcons';

interface ChipProps {
  category: QuickSearchCategory;
  active: boolean;
  loading: boolean;
  onSelect: (key: string) => void;
}

const QuickCategoryChip = React.memo(function QuickCategoryChip({
  category,
  active,
  loading,
  onSelect,
}: ChipProps) {
  const handlePress = useCallback(() => onSelect(category.key), [onSelect, category.key]);
  const iconColor = active ? Colors.white : category.color;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: category.color },
        active && { backgroundColor: category.color },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={category.icon} size={16} color={iconColor} />
      )}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{category.label}</Text>
    </TouchableOpacity>
  );
});

interface HideMyPlacesChipProps {
  hidden: boolean;
  onToggle: () => void;
}

// Sits at the head of the filter row: active (struck-through pin) = the user's own saved
// places are hidden from the map, so only search/POI results are left on it.
const HideMyPlacesChip = React.memo(function HideMyPlacesChip({
  hidden,
  onToggle,
}: HideMyPlacesChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, styles.hideChip, hidden && styles.hideChipActive]}
      onPress={onToggle}
      activeOpacity={0.75}
      accessibilityLabel={hidden ? 'Show my places' : 'Hide my places'}
    >
      <MaterialCommunityIcons
        name={hidden ? 'map-marker-off' : 'map-marker'}
        size={16}
        color={hidden ? Colors.white : Colors.neutral[600]}
      />
      <Text style={[styles.chipLabel, hidden && styles.chipLabelActive]}>
        {hidden ? 'My places hidden' : 'Hide my places'}
      </Text>
    </TouchableOpacity>
  );
});

interface Props {
  query: string;
  weather: CurrentWeather | null;
  activeCategory: string | null;
  myPlacesHidden: boolean;
  onToggleMyPlaces: () => void;
  categoryLoading: boolean;
  canSearchHere: boolean;
  searchHereLoading: boolean;
  onOpenSearch: () => void;
  onOpenWeather: () => void;
  onSelectCategory: (key: string) => void;
  onSearchHere: () => void;
  onClearQuery: () => void;
}

// Google/Apple Maps style top bar: an oval search field that opens the full-screen search
// modal on tap (it's not a real TextInput — typing happens inside the modal, but the pill
// mirrors whatever was last typed there so the two searches read as one), plus a row of
// quick travel-category filters below it that search + pin results directly on the map. When
// a category is active and the map's been panned/zoomed past what was last searched, a
// "Search here" pill appears under the chips (Google/Apple Maps style) instead of silently
// re-searching.
export function MapSearchBar({
  query,
  weather,
  activeCategory,
  myPlacesHidden,
  onToggleMyPlaces,
  categoryLoading,
  canSearchHere,
  searchHereLoading,
  onOpenSearch,
  onOpenWeather,
  onSelectCategory,
  onSearchHere,
  onClearQuery,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']} pointerEvents="box-none">
      <View style={styles.topRow}>
        {weather && (
          <TouchableOpacity
            style={styles.weatherBadge}
            onPress={onOpenWeather}
            activeOpacity={0.85}
          >
            <Ionicons
              name={iconForWeatherCode(weather.weatherCode)}
              size={18}
              color={colorForWeatherCode(weather.weatherCode)}
            />
            <Text style={styles.weatherTemp}>{Math.round(weather.temperatureC)}°</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.pill} onPress={onOpenSearch} activeOpacity={0.85}>
          <Ionicons name="search" size={18} color={Colors.neutral[400]} />
          <Text
            style={[styles.pillText, query.length > 0 && styles.pillTextFilled]}
            numberOfLines={1}
          >
            {query.length > 0 ? query : 'Search places, restaurants, cafes…'}
          </Text>
          {query.length > 0 && (
            <TouchableOpacity onPress={onClearQuery} hitSlop={HIT_SLOP_8}>
              <Ionicons name="close-circle" size={18} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <HideMyPlacesChip hidden={myPlacesHidden} onToggle={onToggleMyPlaces} />
        {QUICK_SEARCH_CATEGORIES.map((category) => (
          <QuickCategoryChip
            key={category.key}
            category={category}
            active={activeCategory === category.key}
            loading={categoryLoading && activeCategory === category.key}
            onSelect={onSelectCategory}
          />
        ))}
      </ScrollView>

      {activeCategory !== null && (canSearchHere || searchHereLoading) && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(120)}
          style={styles.searchHereRow}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.searchHereButton}
            onPress={onSearchHere}
            activeOpacity={0.85}
            disabled={searchHereLoading}
          >
            {searchHereLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="refresh" size={14} color={Colors.white} />
                <Text style={styles.searchHereLabel}>Search here</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginHorizontal: Spacing.s16,
    // Nudged down from the base 8px (twice, +10px each time) so the pill/weather badge clear
    // Mapbox's own top-left scale bar ornament instead of overlapping it.
    marginTop: MAP_SEARCH_PILL_TOP,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    height: 48,
    paddingHorizontal: Spacing.s12,
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  weatherTemp: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    ...Typography.body,
    color: Colors.neutral[400],
    flex: 1,
  },
  pillTextFilled: {
    color: Colors.neutral[900],
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: Spacing.s16,
    paddingTop: Spacing.s8,
    gap: Spacing.s8,
  },
  hideChip: {
    borderColor: Colors.neutral[400],
  },
  hideChipActive: {
    backgroundColor: Colors.neutral[600],
    borderColor: Colors.neutral[600],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    height: 32,
    paddingHorizontal: Spacing.s12,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chipLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  chipLabelActive: {
    color: Colors.white,
  },
  searchHereRow: {
    alignItems: 'center',
    paddingTop: Spacing.s8,
  },
  searchHereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    height: 32,
    minWidth: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.s12,
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchHereLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
  },
});
