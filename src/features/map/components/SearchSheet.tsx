import { Ionicons } from '@expo/vector-icons';
import RNSlider from '@react-native-community/slider';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
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

import { PinChip } from '../../../design-system/components/PinChip';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place, PlaceCategory } from '../../../models/types';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';
import { formatRadius, SpecialFilter } from '../hooks/useSearchSheet';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;
const ANIMATION_DURATION = 280;

interface Props {
  visible: boolean;
  query: string;
  radiusM: number;
  maxRadiusM: number;
  activeCategories: Set<PlaceCategory>;
  specialFilters: Set<SpecialFilter>;
  filteredPlaces: Place[];
  onChangeQuery: (q: string) => void;
  onRadiusChange: (value: number) => void;
  onToggleCategory: (cat: PlaceCategory) => void;
  onToggleSpecial: (filter: SpecialFilter) => void;
  onPlacePress: (placeId: string) => void;
  onClose: () => void;
}

export function SearchSheet({
  visible,
  query,
  radiusM,
  maxRadiusM,
  activeCategories,
  specialFilters,
  filteredPlaces,
  onChangeQuery,
  onRadiusChange,
  onToggleCategory,
  onToggleSpecial,
  onPlacePress,
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

  function renderPlace({ item }: { item: Place }) {
    return (
      <TouchableOpacity
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
              placeholder="Search places…"
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
              label="Mine"
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
            <Text style={styles.sliderLabel}>Radius: {formatRadius(radiusM)}</Text>
            <RNSlider
              style={styles.sliderHost}
              value={radiusM}
              minimumValue={100}
              maximumValue={maxRadiusM}
              step={100}
              onValueChange={onRadiusChange}
              minimumTrackTintColor={Colors.brand.primary}
              maximumTrackTintColor={Colors.neutral[200]}
              thumbTintColor={Colors.brand.primary}
            />
          </View>

          {/* Results */}
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            renderItem={renderPlace}
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={[styles.list, filteredPlaces.length === 0 && styles.listEmpty]}
            style={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No places match your filters</Text>
    </View>
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
  sliderLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s4,
  },
  sliderHost: {
    height: 32,
  },
  list: {
    paddingHorizontal: Spacing.s16,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    gap: Spacing.s12,
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
  separator: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },
  listContainer: {
    flex: 1,
  },
  listEmpty: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
  },
});
