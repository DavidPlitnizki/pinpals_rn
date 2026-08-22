import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { PRESET_TAGS } from '../../../shared/constants';
import { FilterPeriod, PlaceFilters } from '../types';

const WINDOW_HEIGHT = Dimensions.get('window').height;
// Period plus tags is not much content, so this is a bottom sheet that grows to fit rather
// than a full-height page sheet with empty space under it.
const MAX_SHEET_HEIGHT = WINDOW_HEIGHT * 0.7;
const ANIMATION_DURATION = 260;
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
  onToggleTag: (tag: string) => void;
  onSetPeriod: (period: FilterPeriod) => void;
  onClear: () => void;
}

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'year', label: 'Last year' },
  { value: 'all', label: 'All' },
];

export function FiltersSheet({
  visible,
  onClose,
  filters,
  allTags,
  onToggleTag,
  onSetPeriod,
  onClear,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(MAX_SHEET_HEIGHT)).current;

  // Sorting moved out to a single arrow in the list header, so this sheet is just period
  // plus tags now.
  const activeFilterCount = filters.tags.length + (filters.period !== 'all' ? 1 : 0);

  // The whole preset vocabulary, not only tags already in use — a tag you haven't applied to
  // anything yet could otherwise never be filtered by. Custom tags found on places are
  // appended so nothing that exists is unfilterable.
  const tagsToShow = useMemo(() => {
    const extras = allTags.filter((tag) => !PRESET_TAGS.includes(tag));
    return [...PRESET_TAGS, ...extras];
  }, [allTags]);

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
    } else {
      backdropOpacity.setValue(0);
      translateY.setValue(MAX_SHEET_HEIGHT);
    }
  }, [visible, backdropOpacity, translateY]);

  // Animates out first, then tells the parent — otherwise the sheet vanishes instantly.
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: MAX_SHEET_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [backdropOpacity, translateY, onClose]);

  const sheetStyle = useMemo(
    () => [styles.sheet, { maxHeight: MAX_SHEET_HEIGHT, transform: [{ translateY }] }],
    [translateY],
  );
  const footerStyle = useMemo(
    () => [styles.footer, { paddingBottom: insets.bottom + Spacing.s16 }],
    [insets.bottom],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={sheetStyle}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            {activeFilterCount > 0 ? (
              <TouchableOpacity onPress={onClear} hitSlop={HIT_SLOP_8}>
                <Text style={styles.clear}>Clear all</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
            <Text style={styles.title}>Filters</Text>
            <CircleCloseButton onPress={handleClose} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.chips}>
                {tagsToShow.map((tag) => (
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
          </ScrollView>

          <View style={footerStyle}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleClose}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.neutral[50],
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  handleRow: { alignItems: 'center', paddingTop: Spacing.s12, paddingBottom: Spacing.s8 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s12,
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
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s16,
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
