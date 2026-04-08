import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Radii, Spacing, Typography } from "../../design-system/tokens";
import { Meeting, Place } from "../../models/types";
import { MeetingCard } from "./components/MeetingCard";
import { PlaceRow } from "./components/PlaceRow";
import { useMyPlacesScreen } from "./hooks/useMyPlacesScreen";

export default function MyPlacesScreen() {
  const {
    places,
    displayedPlaces,
    upcomingMeetings,
    activeTab,
    setActiveTab,
    handlePlacePress,
    handleDeletePlace,
  } = useMyPlacesScreen();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Places</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
              All ({places.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
            onPress={() => setActiveTab("favorites")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "favorites" && styles.activeTabText,
              ]}
            >
              Favorites ({places.filter((p) => p.isFavorite).length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Place }) => (
            <PlaceRow
              place={item}
              onPress={handlePlacePress}
              onDelete={handleDeletePlace}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {activeTab === "favorites" ? "♥" : "📍"}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "favorites" ? "No favorites yet" : "No places yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "favorites"
                  ? "Mark places as favorites to see them here"
                  : "Long press on the map to add your first place"}
              </Text>
            </View>
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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s8,
  },
  title: { ...Typography.largeTitle, color: Colors.neutral[900] },
  tabs: {
    flexDirection: "row",
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
    fontWeight: "600",
  },
  activeTabText: { color: Colors.white },
  listContent: { padding: Spacing.s16, gap: Spacing.s8 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.s32,
    paddingTop: Spacing.s48,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.s16 },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.neutral[400],
    textAlign: "center",
  },
  meetingsSection: { marginTop: Spacing.s24 },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
    paddingHorizontal: Spacing.s4,
  },
});
