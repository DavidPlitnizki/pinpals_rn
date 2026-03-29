import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinCard } from '../../design-system/components/PinCard';
import { PinChip } from '../../design-system/components/PinChip';
import { PinTextField } from '../../design-system/components/PinTextField';
import { PinRatingView } from '../../design-system/components/PinRatingView';
import { Place, PlaceCategory } from '../../models/types';

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: '#E8834A',
  coffee: '#8B6347',
  nature: '#4A7C59',
  art: '#9C6ADE',
  sports: '#3D9BE9',
};

const ALL_CATEGORIES: Array<PlaceCategory | 'all'> = ['all', 'food', 'nature', 'art', 'sports', 'coffee'];
const CATEGORY_LABELS: Record<PlaceCategory | 'all', string> = {
  all: 'All',
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

export default function ExploreScreen() {
  const router = useRouter();
  const { places } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [places, searchQuery, selectedCategory]);

  function handlePlacePress(id: string) {
    router.push({ pathname: "/place/[id]", params: { id } } as any);
  }

  function renderPlace({ item }: { item: Place }) {
    return (
      <TouchableOpacity onPress={() => handlePlacePress(item.id)} activeOpacity={0.75}>
        <PinCard style={styles.placeCard}>
          <View style={styles.placeHeader}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isFavorite && <Text style={styles.heartIcon}>♥</Text>}
            </View>
            <PinChip
              label={CATEGORY_LABELS[item.category]}
              color={CATEGORY_COLORS[item.category]}
              selected
            />
          </View>
          {item.description ? (
            <Text style={styles.placeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.placeFooter}>
            <PinRatingView rating={item.rating} size={14} />
            <Text style={styles.placeDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </PinCard>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.searchContainer}>
        <PinTextField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search places..."
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {ALL_CATEGORIES.map((cat) => (
          <PinChip
            key={cat}
            label={CATEGORY_LABELS[cat]}
            color={cat === 'all' ? Colors.brand.primary : CATEGORY_COLORS[cat as PlaceCategory]}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {filteredPlaces.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No places found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Long press on the map to add your first place'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s4,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.neutral[900],
  },
  searchContainer: {
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s8,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.s8,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s8,
  },
  listContent: {
    padding: Spacing.s16,
    gap: Spacing.s12,
  },
  placeCard: {
    marginBottom: 0,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s8,
  },
  placeTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    marginRight: Spacing.s8,
  },
  placeName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    flex: 1,
  },
  heartIcon: {
    fontSize: 16,
    color: Colors.accent.primary,
  },
  placeDescription: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    marginBottom: Spacing.s8,
  },
  placeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeDate: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.s16,
  },
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
