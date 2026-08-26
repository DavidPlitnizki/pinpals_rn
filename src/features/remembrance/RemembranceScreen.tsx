import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { Place } from '../../models/types';
import { MostVisitedWidget } from './components/MostVisitedWidget';
import { PhotoViewerModal } from '../../design-system/components/PhotoViewerModal';
import { PlaceFlagToggle } from '../../design-system/components/PlaceFlags';
import { FiltersSheet } from './components/FiltersSheet';
import { StatsWidget } from './components/StatsWidget';
import { PlaceGridCard } from './components/PlaceGridCard';
import { PlaceRow } from './components/PlaceRow';
import { PlacesMiniMap } from './components/PlacesMiniMap';
import { PlaceScope, useRemembranceScreen } from './hooks/useRemembranceScreen';
import { ViewMode } from './types';

const VIEW_MODES: { mode: ViewMode; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'list', icon: 'list' },
  { mode: 'grid', icon: 'grid' },
  { mode: 'map', icon: 'map' },
];

const HIT_SLOP_8_4 = { top: 8, bottom: 8, left: 4, right: 4 };
const HIT_SLOP_6 = { top: 6, bottom: 6, left: 6, right: 6 };

interface ViewModeButtonProps {
  mode: ViewMode;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onSelect: (mode: ViewMode) => void;
}

const ViewModeButton = React.memo(function ViewModeButton({
  mode,
  icon,
  active,
  onSelect,
}: ViewModeButtonProps) {
  const handlePress = useCallback(() => onSelect(mode), [onSelect, mode]);
  return (
    <TouchableOpacity
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
      onPress={handlePress}
      hitSlop={HIT_SLOP_8_4}
    >
      <Ionicons name={icon} size={18} color={active ? Colors.brand.primary : Colors.neutral[400]} />
    </TouchableOpacity>
  );
});

// One message per scope of the All / Favorites / Want-to-visit radio group.
const EMPTY_ICONS: Record<PlaceScope, string> = {
  all: '📍',
  favorites: '♥',
  wantToVisit: '🔖',
};
const EMPTY_TITLES: Record<PlaceScope, string> = {
  all: 'No places yet',
  favorites: 'No favorites yet',
  wantToVisit: 'Nothing on your list yet',
};
const EMPTY_SUBTITLES: Record<PlaceScope, string> = {
  all: 'Long press on the map to add your first place',
  favorites: 'Mark places as favorites to see them here',
  wantToVisit: 'Flag places you want to visit to see them here',
};

export default function RemembranceScreen() {
  const {
    places,
    displayedPlaces,
    viewMode,
    setViewMode,
    mostVisited,
    placeStats,
    filters,
    filtersOpen,
    setFiltersOpen,
    allTags,
    activeFilterCount,
    toggleTag,
    setPeriod,
    placeScope,
    selectPlaceScope,
    toggleSortDirection,
    clearFilters,
    handlePlacePress,
    handleDeletePlace,
  } = useRemembranceScreen();

  const isMapMode = viewMode === 'map';

  // Null until a photo is tapped — the viewer mounts only while open, so its native Modal
  // isn't attached to this screen's tree the rest of the time.
  const [viewer, setViewer] = useState<{ photoUris: string[]; index: number } | null>(null);
  const handleOpenViewer = useCallback((photoUris: string[], index: number) => {
    if (photoUris.length > 0) setViewer({ photoUris, index });
  }, []);
  const handleCloseViewer = useCallback(() => setViewer(null), []);

  const flagCounts = useMemo(
    () => ({
      favorites: places.filter((p) => p.favorite).length,
      wantToVisit: places.filter((p) => p.isFavorite).length,
    }),
    [places],
  );

  const handleOpenFilters = useCallback(() => setFiltersOpen(true), [setFiltersOpen]);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), [setFiltersOpen]);
  const handleSelectAll = useCallback(() => selectPlaceScope('all'), [selectPlaceScope]);
  const handleSelectFavorites = useCallback(
    () => selectPlaceScope('favorites'),
    [selectPlaceScope],
  );
  const handleSelectWantToVisit = useCallback(
    () => selectPlaceScope('wantToVisit'),
    [selectPlaceScope],
  );
  const renderPlaceRow = useCallback(
    ({ item }: ListRenderItemInfo<Place>) => (
      <PlaceRow place={item} onPress={handlePlacePress} onDelete={handleDeletePlace} />
    ),
    [handlePlacePress, handleDeletePlace],
  );

  const renderPlaceGridCard = useCallback(
    ({ item }: ListRenderItemInfo<Place>) => (
      <PlaceGridCard place={item} onPress={handlePlacePress} />
    ),
    [handlePlacePress],
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Remembrance</Text>
          <View style={styles.headerRight}>
            {/* View mode toggle */}
            <View style={styles.viewToggle}>
              {VIEW_MODES.map(({ mode, icon }) => (
                <ViewModeButton
                  key={mode}
                  mode={mode}
                  icon={icon}
                  active={viewMode === mode}
                  onSelect={setViewMode}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Active filter chips summary */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFilters}>
            <Ionicons name="funnel" size={12} color={Colors.brand.primary} />
            <Text style={styles.activeFiltersText}>
              {activeFilterCount === 1 ? '1 filter' : `${activeFilterCount} filters`}
              {' • '}
              {displayedPlaces.length} of {places.length} places
            </Text>
            <TouchableOpacity onPress={clearFilters} hitSlop={HIT_SLOP_6}>
              <Text style={styles.clearFiltersText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Widget */}
        {!isMapMode && <StatsWidget stats={placeStats} />}

        {/* Most visited place */}
        {mostVisited && !isMapMode && (
          <MostVisitedWidget
            memory={mostVisited}
            onPress={handlePlacePress}
            onPhotoPress={handleOpenViewer}
          />
        )}

        {/* All / Favorites tabs — hidden in map mode */}
        {!isMapMode && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, placeScope === 'all' && styles.activeTab]}
              onPress={handleSelectAll}
              accessibilityRole="radio"
              accessibilityState={{ selected: placeScope === 'all' }}
            >
              <Text style={[styles.tabText, placeScope === 'all' && styles.activeTabText]}>
                All ({places.length})
              </Text>
            </TouchableOpacity>
            {/* Want-to-visit is a filter rather than a tab, but it belongs next to Favorites:
                both are "show me only the places I flagged". Each carries its own count so the
                row says how much there is of each without opening anything. */}
            <PlaceFlagToggle
              flag="favorite"
              active={placeScope === 'favorites'}
              onPress={handleSelectFavorites}
              count={flagCounts.favorites}
            />
            <PlaceFlagToggle
              flag="wantToVisit"
              active={placeScope === 'wantToVisit'}
              onPress={handleSelectWantToVisit}
              count={flagCounts.wantToVisit}
            />

            {/* Date-added direction only — one arrow instead of a sort menu. */}
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={toggleSortDirection}
              hitSlop={HIT_SLOP_8_4}
              accessibilityLabel={
                filters.sortBy === 'newest' ? 'Newest added first' : 'Oldest added first'
              }
            >
              <Ionicons
                name={filters.sortBy === 'newest' ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={Colors.neutral[600]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={handleOpenFilters}
              hitSlop={HIT_SLOP_8_4}
              accessibilityLabel="Filters"
            >
              <Ionicons
                name="options"
                size={18}
                color={activeFilterCount > 0 ? Colors.brand.primary : Colors.neutral[400]}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        {/* List view */}
        {viewMode === 'list' && (
          <FlatList
            data={displayedPlaces}
            keyExtractor={keyExtractor}
            renderItem={renderPlaceRow}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState scope={placeScope} hasFilters={activeFilterCount > 0} />
            }
          />
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          <FlatList
            data={displayedPlaces}
            keyExtractor={keyExtractor}
            numColumns={2}
            renderItem={renderPlaceGridCard}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState scope={placeScope} hasFilters={activeFilterCount > 0} />
            }
          />
        )}

        {/* Mini-map view */}
        {viewMode === 'map' && <PlacesMiniMap places={displayedPlaces} />}

        {/* Filters sheet */}
        <FiltersSheet
          visible={filtersOpen}
          onClose={handleCloseFilters}
          filters={filters}
          allTags={allTags}
          onToggleTag={toggleTag}
          onSetPeriod={setPeriod}
          onClear={clearFilters}
        />

        {viewer && (
          <PhotoViewerModal
            visible
            photoUris={viewer.photoUris}
            initialIndex={viewer.index}
            onClose={handleCloseViewer}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function keyExtractor(item: Place) {
  return item.id;
}

function EmptyState({ scope, hasFilters }: { scope: PlaceScope; hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Nothing found</Text>
        <Text style={styles.emptySubtitle}>Try changing or clearing the filters</Text>
      </View>
    );
  }
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{EMPTY_ICONS[scope]}</Text>
      <Text style={styles.emptyTitle}>{EMPTY_TITLES[scope]}</Text>
      <Text style={styles.emptySubtitle}>{EMPTY_SUBTITLES[scope]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s8,
  },
  title: { ...Typography.largeTitle, color: Colors.neutral[900] },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  sortBtn: {
    marginLeft: 'auto',
    padding: Spacing.s8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.neutral[100],
  },
  filterBtn: {
    padding: Spacing.s8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.neutral[100],
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: Spacing.s4,
    backgroundColor: Colors.neutral[100],
    borderRadius: Radii.sm,
    padding: 3,
  },
  toggleBtn: {
    padding: Spacing.s4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s8,
  },
  activeFiltersText: {
    ...Typography.caption,
    color: Colors.brand.primary,
    flex: 1,
  },
  clearFiltersText: {
    ...Typography.caption,
    color: Colors.neutral[400],
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    marginBottom: Spacing.s8,
    gap: Spacing.s8,
  },
  tab: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.full,
    backgroundColor: Colors.neutral[100],
  },
  activeTab: { backgroundColor: Colors.brand.primary },
  tabText: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  activeTabText: { color: Colors.white },
  listContent: { padding: Spacing.s16, gap: Spacing.s8 },
  gridContent: { padding: Spacing.s16 },
  gridRow: { gap: Spacing.s8, marginBottom: Spacing.s8 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s32,
    paddingTop: Spacing.s48,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.s16 },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
});
