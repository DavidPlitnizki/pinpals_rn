import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinCard } from '../../design-system/components/PinCard';
import { PinChip } from '../../design-system/components/PinChip';
import { PinRatingView } from '../../design-system/components/PinRatingView';
import { Place, Meeting, PlaceCategory } from '../../models/types';

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: '#E8834A',
  coffee: '#8B6347',
  nature: '#4A7C59',
  art: '#9C6ADE',
  sports: '#3D9BE9',
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: 'Food',
  nature: 'Nature',
  art: 'Art',
  sports: 'Sports',
  coffee: 'Coffee',
};

type Tab = 'all' | 'favorites';

export default function MyPlacesScreen() {
  const router = useRouter();
  const { places, meetings, deletePlace } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const displayedPlaces = activeTab === 'favorites' ? places.filter((p) => p.isFavorite) : places;

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function handlePlacePress(id: string) {
    router.push({ pathname: "/place/[id]", params: { id } } as any);
  }

  function handleDeletePlace(id: string, name: string) {
    Alert.alert(
      'Delete Place',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePlace(id) },
      ]
    );
  }

  function renderDeleteAction(placeId: string, placeName: string) {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeletePlace(placeId, placeName)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  function renderPlace({ item }: { item: Place }) {
    return (
      <Swipeable
        renderRightActions={() => renderDeleteAction(item.id, item.name)}
        overshootRight={false}
      >
        <TouchableOpacity onPress={() => handlePlacePress(item.id)} activeOpacity={0.75}>
          <PinCard style={styles.placeCard}>
            <View style={styles.placeRow}>
              <View style={styles.placeInfo}>
                <View style={styles.placeTitleRow}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.isFavorite && <Text style={styles.heartIcon}>♥</Text>}
                </View>
                <View style={styles.placeMeta}>
                  <PinChip
                    label={CATEGORY_LABELS[item.category]}
                    color={CATEGORY_COLORS[item.category]}
                    selected
                  />
                  <PinRatingView rating={item.rating} size={12} />
                </View>
                <Text style={styles.placeDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </PinCard>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  function renderMeeting({ item }: { item: Meeting }) {
    return (
      <PinCard style={styles.meetingCard}>
        <View style={styles.meetingRow}>
          <View style={styles.meetingDateBox}>
            <Text style={styles.meetingDay}>
              {new Date(item.date).getDate()}
            </Text>
            <Text style={styles.meetingMonth}>
              {new Date(item.date).toLocaleString('default', { month: 'short' })}
            </Text>
          </View>
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingTitle} numberOfLines={1}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.meetingDescription} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.meetingTime}>
              {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </PinCard>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Places</Text>
        </View>

        {/* Tabs */}
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

        <FlatList
          data={displayedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
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
          }
          ListFooterComponent={
            upcomingMeetings.length > 0 ? (
              <View style={styles.meetingsSection}>
                <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
                {upcomingMeetings.map((m) => (
                  <React.Fragment key={m.id}>{renderMeeting({ item: m })}</React.Fragment>
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
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s8,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.neutral[900],
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
  activeTab: {
    backgroundColor: Colors.brand.primary,
  },
  tabText: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.s16,
    gap: Spacing.s8,
  },
  placeCard: {
    marginBottom: 0,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    marginBottom: Spacing.s4,
  },
  placeName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    flex: 1,
  },
  heartIcon: {
    fontSize: 14,
    color: Colors.accent.primary,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  placeDate: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  chevron: {
    fontSize: 22,
    color: Colors.neutral[300],
    marginLeft: Spacing.s8,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Radii.md,
    marginLeft: Spacing.s8,
    marginBottom: 0,
  },
  deleteActionText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s32,
    paddingTop: Spacing.s48,
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
  meetingsSection: {
    marginTop: Spacing.s24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
    paddingHorizontal: Spacing.s4,
  },
  meetingCard: {
    marginBottom: Spacing.s8,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  meetingDateBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingDay: {
    ...Typography.headline,
    color: Colors.brand.dark,
    lineHeight: 20,
  },
  meetingMonth: {
    ...Typography.caption,
    color: Colors.brand.primary,
    textTransform: 'uppercase',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    ...Typography.headline,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  meetingDescription: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    marginBottom: 2,
  },
  meetingTime: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
});
