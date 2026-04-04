import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Colors,
  Radii,
  Spacing,
  Typography,
} from "../../../design-system/tokens";
import { Place, PlaceCategory } from "../../../models/types";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";
import { SpecialFilter } from "../hooks/useSearchSheet";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.75;
const ANIMATION_DURATION = 280;

interface Props {
  visible: boolean;
  query: string;
  activeCategories: Set<PlaceCategory>;
  specialFilters: Set<SpecialFilter>;
  filteredPlaces: Place[];
  onChangeQuery: (q: string) => void;
  onToggleCategory: (cat: PlaceCategory) => void;
  onToggleSpecial: (filter: SpecialFilter) => void;
  onPlacePress: (placeId: string) => void;
  onClose: () => void;
}

export function SearchSheet({
  visible,
  query,
  activeCategories,
  specialFilters,
  filteredPlaces,
  onChangeQuery,
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
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: CATEGORY_COLORS[item.category] },
          ]}
        />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.placeMeta}>
            {CATEGORY_LABELS[item.category]}
            {"  "}
            {"★".repeat(item.rating)}
            {item.isFavorite ? "  ⭐" : ""}
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
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
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
          >
            {CATEGORIES.map((cat) => {
              const active = activeCategories.has(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? CATEGORY_COLORS[cat]
                        : Colors.neutral[50],
                      borderColor: CATEGORY_COLORS[cat],
                    },
                  ]}
                  onPress={() => onToggleCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: active ? Colors.white : CATEGORY_COLORS[cat] },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: specialFilters.has("mine")
                    ? Colors.brand.primary
                    : Colors.neutral[50],
                  borderColor: Colors.brand.primary,
                },
              ]}
              onPress={() => onToggleSpecial("mine")}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: specialFilters.has("mine")
                      ? Colors.white
                      : Colors.brand.primary,
                  },
                ]}
              >
                Mine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: specialFilters.has("favorites")
                    ? Colors.warning
                    : Colors.neutral[50],
                  borderColor: Colors.warning,
                },
              ]}
              onPress={() => onToggleSpecial("favorites")}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: specialFilters.has("favorites")
                      ? Colors.white
                      : Colors.warning,
                  },
                ]}
              >
                ⭐ Want to visit
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Results */}
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            renderItem={renderPlace}
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={styles.list}
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
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    backgroundColor: Colors.neutral[50],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    gap: Spacing.s8,
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
  chipsRow: {
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s8,
    paddingBottom: Spacing.s12,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s4,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    ...Typography.subheadline,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: Spacing.s16,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
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
  empty: {
    paddingVertical: Spacing.s32,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
  },
});
