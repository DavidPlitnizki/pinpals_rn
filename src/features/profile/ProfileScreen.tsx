import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
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
import { Colors, Spacing, Typography } from '../../design-system/tokens';
import { AuthProviderId } from '../../services/firebaseAuth';
import { AvatarPickerSheet } from './components/AvatarPickerSheet';
import { useProfileScreen } from './hooks/useProfileScreen';
import { getInitials } from './utils/getInitials';

const PROVIDER_BADGE: Record<
  AuthProviderId,
  { icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  'google.com': { icon: 'logo-google' },
  'apple.com': { icon: 'logo-apple' },
  anonymous: { icon: 'eye-off' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isGuest,
    authData,
    places,
    savedRoutes,
    isEditing,
    handleStartEdit,
    name,
    setName,
    avatarSheetVisible,
    openAvatarSheet,
    closeAvatarSheet,
    handlePickPhoto,
    handleSelectAvatarPreset,
    handleClearAvatarPreset,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
  } = useProfileScreen();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const providerBadge = PROVIDER_BADGE[authData?.providerId ?? 'anonymous'];

  const handleOpenPrivacy = useCallback(() => router.push('/legal?type=privacy' as any), [router]);
  const handleOpenTerms = useCallback(() => router.push('/legal?type=terms' as any), [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={handleStartEdit} hitSlop={HIT_SLOP} style={styles.editRow}>
            <Ionicons name="create-outline" size={18} color={Colors.brand.primary} />
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleCancelEdit} hitSlop={HIT_SLOP}>
            <Text style={styles.cancelLink}>Cancel</Text>
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
                  <PinButton title="Save Changes" onPress={handleSave} fullWidth />
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
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{places.length}</Text>
                  <Text style={styles.statLabel}>Places</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{savedRoutes.length}</Text>
                  <Text style={styles.statLabel}>Routes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{places.filter((p) => p.isFavorite).length}</Text>
                  <Text style={styles.statLabel}>Want to Visit</Text>
                </View>
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
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{appVersion}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValue}>iOS</Text>
              </View>
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
  cancelLink: { ...Typography.body, color: Colors.neutral[500] },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s4 },
  editLink: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
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
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    ...Typography.title1,
    color: Colors.brand.primary,
    marginBottom: Spacing.s4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[50],
  },
  infoLabel: { ...Typography.subheadline, color: Colors.neutral[600] },
  infoValue: { ...Typography.subheadline, color: Colors.neutral[400] },
  accountCard: { marginBottom: 0 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
  },
  accountIcon: { marginRight: Spacing.s12 },
  accountDivider: { height: 1, backgroundColor: Colors.neutral[100] },
  accountRowText: { ...Typography.body, color: Colors.neutral[700], flex: 1 },
  accountRowTextDanger: { ...Typography.body, color: Colors.error, flex: 1 },
});
