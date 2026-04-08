import React from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinChip } from "../../design-system/components/PinChip";
import { PinTextField } from "../../design-system/components/PinTextField";
import { Colors, Spacing, Typography } from "../../design-system/tokens";
import { Place } from "../../models/types";
import { EmptyState } from "./components/EmptyState";
import { PlaceCard } from "./components/PlaceCard";
import {
  ALL_CATEGORIES,
  ALL_CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "./constants";
import { useExploreScreen } from "./hooks/useExploreScreen";

export default function ExploreScreen() {
  const {
    filteredPlaces,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    handlePlacePress,
  } = useExploreScreen();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
            label={ALL_CATEGORY_LABELS[cat]}
            color={cat === "all" ? Colors.brand.primary : CATEGORY_COLORS[cat]}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {filteredPlaces.length === 0 ? (
        <EmptyState hasFilters={!!searchQuery || selectedCategory !== "all"} />
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Place }) => (
            <PlaceCard place={item} onPress={handlePlacePress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
  },
  header: {
    paddingHorizontal: Spacing.s16,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s4,
  },
  title: { ...Typography.largeTitle, color: Colors.neutral[900] },
  searchContainer: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s8,
  },
  filterScroll: { maxHeight: 50 },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.s8,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s8,
  },
  listContent: {
    padding: Spacing.s16,
    gap: Spacing.s12,
  },
});
