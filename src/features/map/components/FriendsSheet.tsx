import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
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

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { useProfileStore } from '../../../store/useProfileStore';
import { Friend, Group, Recent } from '../hooks/useFriendsSheet';
import { getInitials } from '../utils/getInitials';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;
const ANIMATION_DURATION = 280;

interface Props {
  visible: boolean;
  query: string;
  filteredFriends: Friend[];
  filteredGroups: Group[];
  recents: Recent[];
  onChangeQuery: (q: string) => void;
  onClose: () => void;
}

export function FriendsSheet({
  visible,
  query,
  filteredFriends,
  filteredGroups,
  recents,
  onChangeQuery,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
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

  function handleFriendPress(friend: Friend) {
    Alert.alert(friend.name, 'Open chat (Phase 2)');
  }

  function handleGroupPress(group: Group) {
    Alert.alert(group.name, 'Open group chat (Phase 2)');
  }

  function handleInvitePress() {
    Alert.alert('Add friends / Create chat', 'Coming in Phase 2');
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

          {/* Search */}
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={Colors.neutral[400]} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search friends & groups…"
              placeholderTextColor={Colors.neutral[400]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Add friends / Create chat — first */}
            <TouchableOpacity
              style={styles.inviteRow}
              onPress={handleInvitePress}
              activeOpacity={0.7}
            >
              <View style={styles.inviteIcon}>
                <Ionicons name="person-add" size={18} color={Colors.brand.primary} />
              </View>
              <Text style={styles.inviteLabel}>Add friends / Create chat</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Recent — horizontal row */}
            <Text style={styles.sectionLabel}>Recent</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentsRow}
            >
              {/* Own circle first */}
              <TouchableOpacity style={styles.recentItem} activeOpacity={0.75}>
                <View style={[styles.recentAvatar, styles.myAvatar]}>
                  <Text style={[styles.recentAvatarText, styles.myAvatarText]}>
                    {getInitials(profile.name)}
                  </Text>
                </View>
                <Text style={styles.recentName} numberOfLines={1}>
                  You
                </Text>
              </TouchableOpacity>

              {recents.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentItem}
                  activeOpacity={0.75}
                  onPress={() =>
                    Alert.alert(
                      item.name,
                      `Open ${item.type === 'group' ? 'group chat' : 'chat'} (Phase 2)`,
                    )
                  }
                >
                  <View
                    style={[
                      styles.recentAvatar,
                      item.type === 'group' ? styles.groupAvatar : undefined,
                    ]}
                  >
                    {item.type === 'group' ? (
                      <Ionicons name="people" size={16} color={Colors.accent.primary} />
                    ) : (
                      <Text style={styles.recentAvatarText}>{getInitials(item.name)}</Text>
                    )}
                    {item.unread > 0 && <View style={styles.recentBadge} />}
                  </View>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            {/* Group Chats */}
            <Text style={styles.sectionLabel}>Group Chats</Text>
            {filteredGroups.map((group, index) => (
              <View key={group.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, styles.groupAvatar]}>
                    <Ionicons name="people" size={16} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{group.name}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {group.membersCount} members
                      {group.lastMessage ? `  ·  ${group.lastMessage}` : ''}
                    </Text>
                  </View>
                  {group.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{group.unread}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={Colors.neutral[300]} />
                </TouchableOpacity>
                {index < filteredGroups.length - 1 && <View style={styles.separator} />}
              </View>
            ))}

            <View style={styles.divider} />

            {/* Friends */}
            <Text style={styles.sectionLabel}>Friends</Text>
            {filteredFriends.map((friend, index) => (
              <View key={friend.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleFriendPress(friend)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{friend.name}</Text>
                    {friend.lastMessage ? (
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {friend.lastMessage}
                      </Text>
                    ) : null}
                  </View>
                  {friend.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{friend.unread}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={Colors.neutral[300]} />
                </TouchableOpacity>
                {index < filteredFriends.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
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
    backgroundColor: Colors.white,
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
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s12,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteLabel: {
    ...Typography.callout,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.s8,
  },
  sectionLabel: {
    ...Typography.footnote,
    color: Colors.neutral[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s8,
  },
  myAvatar: {
    backgroundColor: Colors.brand.primary,
  },
  myAvatarText: {
    color: Colors.white,
  },
  recentsRow: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s12,
    gap: Spacing.s16,
  },
  recentItem: {
    alignItems: 'center',
    gap: Spacing.s4,
    width: 56,
  },
  recentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  recentBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  recentName: {
    ...Typography.caption,
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  groupAvatar: {
    backgroundColor: Colors.accent.light,
  },
  avatarText: {
    ...Typography.footnote,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s12,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    ...Typography.callout,
    color: Colors.neutral[900],
    fontWeight: '600',
    marginBottom: 2,
  },
  rowMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginLeft: Spacing.s16 + 36 + Spacing.s12,
  },
});
