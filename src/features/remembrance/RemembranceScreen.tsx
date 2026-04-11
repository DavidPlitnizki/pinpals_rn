import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { Meeting, Place } from '../../models/types';
import { DayMemoryWidget } from './components/DayMemoryWidget';
import { FiltersSheet } from './components/FiltersSheet';
import { StatsWidget } from './components/StatsWidget';
import { MeetingCard } from './components/MeetingCard';
import { PlaceGridCard } from './components/PlaceGridCard';
import { PlaceRow } from './components/PlaceRow';
import { PlacesMiniMap } from './components/PlacesMiniMap';
import { useRemembranceScreen } from './hooks/useRemembranceScreen';
import { ViewMode } from './types';

const VIEW_MODES: { mode: ViewMode; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'list', icon: 'list' },
  { mode: 'grid', icon: 'grid' },
  { mode: 'map', icon: 'map' },
];

export default function RemembranceScreen() {
  const {
    places,
    displayedPlaces,
    upcomingMeetings,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    dayMemory,
    placeStats,
    filters,
    filtersOpen,
    setFiltersOpen,
    allTags,
    allMoods,
    activeFilterCount,
    toggleTag,
    toggleMood,
    setPeriod,
    clearFilters,
    handlePlacePress,
    handleDeletePlace,
  } = useRemembranceScreen();

  const isMapMode = viewMode === 'map';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Remembrance</Text>
          <View style={styles.headerRight}>
            {/* Filter button */}
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setFiltersOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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

            {/* View mode toggle */}
            <View style={styles.viewToggle}>
              {VIEW_MODES.map(({ mode, icon }) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
                  onPress={() => setViewMode(mode)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={icon}
                    size={18}
                    color={viewMode === mode ? Colors.brand.primary : Colors.neutral[400]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Active filter chips summary */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFilters}>
            <Ionicons name="funnel" size={12} color={Colors.brand.primary} />
            <Text style={styles.activeFiltersText}>
              {activeFilterCount === 1 ? '1 фильтр' : `${activeFilterCount} фильтра`}
              {' • '}
              {displayedPlaces.length} из {places.length} мест
            </Text>
            <TouchableOpacity
              onPress={clearFilters}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.clearFiltersText}>✕ Сбросить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Widget */}
        {!isMapMode && <StatsWidget stats={placeStats} />}

        {/* Day Memory Widget */}
        {dayMemory && !isMapMode && (
          <DayMemoryWidget memory={dayMemory} onPress={handlePlacePress} />
        )}

        {/* All / Favorites tabs — hidden in map mode */}
        {!isMapMode && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All ({places.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
              onPress={() => setActiveTab('favorites')}
            >
              <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
                Favorites ({places.filter((p) => p.isFavorite).length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <FlatList
            data={displayedPlaces}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: Place }) => (
              <PlaceRow
                place={item}
                onPress={handlePlacePress}
                onDelete={handleDeletePlace}
                allTags={allTags}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState activeTab={activeTab} hasFilters={activeFilterCount > 0} />
            }
            ListFooterComponent={
              upcomingMeetings.length > 0 ? (
                <View style={styles.meetingsSection}>
                  <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
                  {upcomingMeetings.map((m: Meeting) => (
                    <MeetingCard key={m.id} meeting={m} />
                  ))}
                </View>
              ) : null
            }
          />
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          <FlatList
            data={displayedPlaces}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }: { item: Place }) => (
              <PlaceGridCard place={item} onPress={handlePlacePress} allTags={allTags} />
            )}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState activeTab={activeTab} hasFilters={activeFilterCount > 0} />
            }
          />
        )}

        {/* Mini-map view */}
        {viewMode === 'map' && <PlacesMiniMap places={displayedPlaces} />}

        {/* Filters sheet */}
        <FiltersSheet
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          allTags={allTags}
          allMoods={allMoods}
          onToggleTag={toggleTag}
          onToggleMood={toggleMood}
          onSetPeriod={setPeriod}
          onClear={clearFilters}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function EmptyState({ activeTab, hasFilters }: { activeTab: string; hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Ничего не найдено</Text>
        <Text style={styles.emptySubtitle}>Попробуйте изменить или сбросить фильтры</Text>
      </View>
    );
  }
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{activeTab === 'favorites' ? '♥' : '📍'}</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'favorites' ? 'No favorites yet' : 'No places yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'favorites'
          ? 'Mark places as favorites to see them here'
          : 'Long press on the map to add your first place'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  meetingsSection: { marginTop: Spacing.s24 },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
    paddingHorizontal: Spacing.s4,
  },
});
