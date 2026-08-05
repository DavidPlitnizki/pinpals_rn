import React, { useCallback } from 'react';
import {
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MEMORY_MOODS, MOOD_CONFIG } from '../../../models/types';
import { FilterPeriod, PlaceFilters, SortOption } from '../types';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface FilterChipProps<T> {
  value: T;
  label: string;
  active: boolean;
  onSelect: (value: T) => void;
  activeStyle?: StyleProp<ViewStyle>;
}

function FilterChipInner<T>({ value, label, active, onSelect, activeStyle }: FilterChipProps<T>) {
  const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <TouchableOpacity
      style={[styles.chip, active && (activeStyle ?? styles.chipActive)]}
      onPress={handlePress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const FilterChip = React.memo(FilterChipInner) as typeof FilterChipInner;

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: PlaceFilters;
  allTags: string[];
  allMoods: string[];
  onToggleTag: (tag: string) => void;
  onToggleMood: (mood: string) => void;
  onSetPeriod: (period: FilterPeriod) => void;
  onToggleWantToVisit: () => void;
  onSetSortBy: (sortBy: SortOption) => void;
  onClear: () => void;
}

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: 'year', label: 'Year' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'mostVisited', label: 'Most Visited' },
];

export function FiltersSheet({
  visible,
  onClose,
  filters,
  allTags,
  allMoods,
  onToggleTag,
  onToggleMood,
  onSetPeriod,
  onToggleWantToVisit,
  onSetSortBy,
  onClear,
}: Props) {
  const activeFilterCount =
    filters.tags.length +
    filters.moods.length +
    (filters.period !== 'all' ? 1 : 0) +
    (filters.wantToVisit ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0);

  // Show all known moods, not just ones used — so user can explore
  const moodsToShow = MEMORY_MOODS.filter((m) => allMoods.includes(m));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {activeFilterCount > 0 ? (
            <TouchableOpacity onPress={onClear} hitSlop={HIT_SLOP_8}>
              <Text style={styles.clear}>Clear all</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text style={styles.title}>Filters</Text>
          <CircleCloseButton onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sort */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.chips}>
              {SORT_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  active={filters.sortBy === opt.value}
                  onSelect={onSetSortBy}
                />
              ))}
            </View>
          </View>

          {/* Want to visit */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.chip, filters.wantToVisit && styles.chipActive]}
              onPress={onToggleWantToVisit}
            >
              <Text style={[styles.chipText, filters.wantToVisit && styles.chipTextActive]}>
                ♥ Want to Visit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Period</Text>
            <View style={styles.chips}>
              {PERIOD_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  active={filters.period === opt.value}
                  onSelect={onSetPeriod}
                />
              ))}
            </View>
          </View>

          {/* Mood */}
          {moodsToShow.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mood</Text>
              <View style={styles.chips}>
                {moodsToShow.map((mood) => {
                  const cfg = MOOD_CONFIG[mood];
                  return (
                    <FilterChip
                      key={mood}
                      value={mood}
                      label={`${cfg.emoji} ${cfg.label}`}
                      active={filters.moods.includes(mood)}
                      onSelect={onToggleMood}
                      activeStyle={{ backgroundColor: cfg.color, borderColor: cfg.color }}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.chips}>
                {allTags.map((tag) => (
                  <FilterChip
                    key={tag}
                    value={tag}
                    label={`#${tag}`}
                    active={filters.tags.includes(tag)}
                    onSelect={onToggleTag}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: { ...Typography.headline, color: Colors.neutral[900] },
  clear: { ...Typography.body, color: Colors.accent.primary, fontWeight: '600' },
  placeholder: { width: 28 },
  content: { padding: Spacing.s20, gap: Spacing.s24 },
  section: { gap: Spacing.s12 },
  sectionTitle: { ...Typography.title3, color: Colors.neutral[900] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s8 },
  chip: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    borderRadius: Radii.full,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  chipText: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  chipTextActive: { color: Colors.white },
  footer: {
    padding: Spacing.s20,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  applyBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s16,
    alignItems: 'center',
  },
  applyText: { ...Typography.headline, color: Colors.white },
});
