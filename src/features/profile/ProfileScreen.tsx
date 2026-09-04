import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../design-system/components/Avatar';
import { PinButton } from '../../design-system/components/PinButton';
import { PinCard } from '../../design-system/components/PinCard';
import { PinTextField } from '../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { AuthProviderId } from '../../services/firebaseAuth';
import { AvatarPickerSheet } from './components/AvatarPickerSheet';
import { WhatsNewModal } from './components/WhatsNewModal';
import { useProfileScreen } from './hooks/useProfileScreen';
import { APP_VERSION } from '../../shared/releaseNotes';
import { getInitials } from '../../shared/getInitials';

const PROVIDER_BADGE: Record<
  AuthProviderId,
  { icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  'google.com': { icon: 'logo-google' },
  'apple.com': { icon: 'logo-apple' },
  anonymous: { icon: 'eye-off' },
};

// Same hues the Remembrance flag toggles use, so a heart means the same thing on both
// screens.
const WANT_COLOR = Colors.accent.primary;
const FAVORITE_COLOR = Colors.error;

function SavedStat({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statItem} accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statNumber}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isGuest,
    authData,
    savedCounts,
    isEditing,
    handleStartEdit,
    name,
    setName,
    avatarSheetVisible,
    openAvatarSheet,
    closeAvatarSheet,
    whatsNewVisible,
    openWhatsNew,
    closeWhatsNew,
    handlePickPhoto,
    handleSelectAvatarPreset,
    handleClearAvatarPreset,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
    handleReplayOnboarding,
  } = useProfileScreen();

  const providerBadge = PROVIDER_BADGE[authData?.providerId ?? 'anonymous'];

  const handleOpenPrivacy = useCallback(() => router.push('/legal?type=privacy' as any), [router]);
  const handleOpenTerms = useCallback(() => router.push('/legal?type=terms' as any), [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity
            onPress={handleStartEdit}
            hitSlop={HIT_SLOP}
            style={styles.headerIconButton}
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="pencil" size={20} color={Colors.brand.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCancelEdit}
            hitSlop={HIT_SLOP}
            style={styles.headerIconButtonMuted}
            accessibilityLabel="Cancel editing"
          >
            <Ionicons name="close" size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {isGuest && !profile.avatarUri && !profile.avatarPreset ? (
            <View style={styles.avatarPlaceholderGuest}>
              <MaterialCommunityIcons name="incognito" size={48} color={Colors.neutral[400]} />
            </View>
          ) : (
            <Avatar profile={profile} size={96} getInitials={getInitials} />
          )}
          {isEditing && (
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={openAvatarSheet}
              hitSlop={HIT_SLOP}
            >
              <Ionicons name="camera" size={15} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View style={styles.providerBadge}>
            <Ionicons name={providerBadge.icon} size={12} color={Colors.white} />
          </View>
        </View>
      </View>

      {/* Scrollable content */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Profile Info */}
            <PinCard style={styles.profileCard}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <PinTextField
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                  />
                  <View style={styles.fieldSpacing} />
                  <PinButton
                    title="Save Changes"
                    onPress={handleSave}
                    fullWidth
                    leftIcon={SAVE_ICON}
                  />
                </View>
              ) : (
                <Text style={styles.profileName}>{profile.name}</Text>
              )}
            </PinCard>

            {/* Stats */}
            <PinCard style={styles.statsCard}>
              <View style={styles.statsTitleRow}>
                <Ionicons name="bookmark" size={16} color={Colors.neutral[700]} />
                <Text style={styles.statsTitle}>Saved</Text>
              </View>
              {/* Icons instead of captions — each stat is identified by the same symbol and
                  colour it carries everywhere else in the app, so the row stays readable at a
                  glance without four wrapping two-word labels. */}
              <View style={styles.statsRow}>
                <SavedStat
                  icon="location"
                  color={Colors.brand.primary}
                  value={savedCounts.places}
                  label="Total places"
                />
                <View style={styles.statDivider} />
                <SavedStat
                  icon="bookmark"
                  color={WANT_COLOR}
                  value={savedCounts.wantToVisit}
                  label="Want to visit"
                />
                <View style={styles.statDivider} />
                <SavedStat
                  icon="heart"
                  color={FAVORITE_COLOR}
                  value={savedCounts.favorites}
                  label="Favorites"
                />
              </View>
            </PinCard>

            {/* Legal */}
            <PinCard style={styles.accountCard}>
              <TouchableOpacity style={styles.accountRow} onPress={handleOpenPrivacy}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={Colors.neutral[700]}
                  style={styles.accountIcon}
                />
                <Text style={styles.accountRowText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
              </TouchableOpacity>
              <View style={styles.accountDivider} />
              <TouchableOpacity style={styles.accountRow} onPress={handleOpenTerms}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={Colors.neutral[700]}
                  style={styles.accountIcon}
                />
                <Text style={styles.accountRowText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
              </TouchableOpacity>
            </PinCard>

            {/* App Info */}
            <PinCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>About Pinpals</Text>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={openWhatsNew}
                accessibilityLabel="What's new"
              >
                <Text style={styles.infoLabel}>Version</Text>
                <View style={styles.versionValueRow}>
                  <Text style={styles.infoValue}>{APP_VERSION}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.neutral[300]} />
                </View>
              </TouchableOpacity>
              <View style={styles.accountDivider} />
              <TouchableOpacity
                style={styles.accountRow}
                onPress={handleReplayOnboarding}
                accessibilityLabel="Show the tour again"
              >
                <Ionicons
                  name="compass-outline"
                  size={20}
                  color={Colors.neutral[700]}
                  style={styles.accountIcon}
                />
                <View style={styles.accountRowTextCol}>
                  <Text style={styles.accountRowTitle}>Show the tour again</Text>
                  <Text style={styles.accountRowSubtext}>
                    Walks you through saving a place and keeping a memory of it
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
              </TouchableOpacity>
            </PinCard>

            {/* Account Actions */}
            <PinCard style={styles.accountCard}>
              <TouchableOpacity style={styles.accountRow} onPress={handleLogout}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={Colors.neutral[700]}
                  style={styles.accountIcon}
                />
                <Text style={styles.accountRowText}>Log Out</Text>
              </TouchableOpacity>
              <View style={styles.accountDivider} />
              <TouchableOpacity style={styles.accountRow} onPress={handleDeleteAccount}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={Colors.error}
                  style={styles.accountIcon}
                />
                <Text style={styles.accountRowTextDanger}>Delete Account</Text>
              </TouchableOpacity>
            </PinCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {whatsNewVisible && <WhatsNewModal visible={whatsNewVisible} onClose={closeWhatsNew} />}

      {avatarSheetVisible && (
        <AvatarPickerSheet
          visible={avatarSheetVisible}
          selectedPresetId={profile.avatarPreset}
          onClose={closeAvatarSheet}
          onPickPhoto={handlePickPhoto}
          onSelectPreset={handleSelectAvatarPreset}
          onClearPreset={handleClearAvatarPreset}
        />
      )}
    </SafeAreaView>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Created once at module level — an inline element would be a new object on every render.
const SAVE_ICON = <Ionicons name="checkmark" size={20} color={Colors.white} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s16,
  },
  title: { ...Typography.largeTitle, color: Colors.neutral[900] },
  // Same round icon-button pair as the place detail header, so "edit / back out" reads the
  // same way on both screens.
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.light,
  },
  headerIconButtonMuted: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.neutral[100],
  },
  avatarSection: { alignItems: 'center', paddingBottom: Spacing.s16 },
  avatarContainer: { position: 'relative' },
  avatarPlaceholderGuest: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brand.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  providerBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.s16, gap: Spacing.s16, paddingBottom: 100 },
  profileCard: { marginBottom: 0 },
  editForm: { gap: Spacing.s4 },
  fieldSpacing: { height: Spacing.s4 },
  profileName: {
    ...Typography.title2,
    color: Colors.neutral[900],
  },
  statsCard: { marginBottom: 0 },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginBottom: Spacing.s16,
  },
  statsTitle: {
    ...Typography.headline,
    color: Colors.neutral[700],
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: Spacing.s4 },
  statNumber: {
    ...Typography.title2,
    color: Colors.neutral[900],
  },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.neutral[100] },
  infoCard: { marginBottom: 0 },
  infoTitle: {
    ...Typography.headline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.s8,
  },
  infoLabel: { ...Typography.subheadline, color: Colors.neutral[600] },
  infoValue: { ...Typography.subheadline, color: Colors.neutral[400] },
  versionValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s4 },
  accountCard: { marginBottom: 0 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
  },
  accountIcon: { marginRight: Spacing.s12 },
  accountDivider: { height: 1, backgroundColor: Colors.neutral[100] },
  accountRowText: { ...Typography.body, color: Colors.neutral[700], flex: 1 },
  // The two-line variant: the column takes the flex, so the title must not also claim it —
  // a flexed Text inside a column stretches and pushes the subtitle off its baseline.
  accountRowTextCol: { flex: 1 },
  accountRowTitle: { ...Typography.body, color: Colors.neutral[700] },
  accountRowSubtext: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    marginTop: Spacing.s2,
  },
  accountRowTextDanger: { ...Typography.body, color: Colors.error, flex: 1 },
});
