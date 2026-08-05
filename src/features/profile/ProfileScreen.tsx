import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinButton } from '../../design-system/components/PinButton';
import { PinCard } from '../../design-system/components/PinCard';
import { PinTextField } from '../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { AuthProviderId } from '../../services/firebaseAuth';
import { FontScale, ThemePreference } from '../../store/useSettingsStore';
import { useProfileScreen } from './hooks/useProfileScreen';
import { getInitials } from './utils/getInitials';

const PROVIDER_BADGE: Record<
  AuthProviderId,
  { icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  'google.com': { icon: 'logo-google' },
  'apple.com': { icon: 'logo-apple' },
  password: { icon: 'mail' },
  anonymous: { icon: 'eye-off' },
};

const FONT_SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

interface SettingChipProps<T extends string> {
  value: T;
  label: string;
  active: boolean;
  onSelect: (value: T) => void;
}

function SettingChipInner<T extends string>({
  value,
  label,
  active,
  onSelect,
}: SettingChipProps<T>) {
  const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={handlePress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const SettingChip = React.memo(SettingChipInner) as typeof SettingChipInner;

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isGuest,
    authData,
    places,
    meetings,
    isEditing,
    setIsEditing,
    name,
    setName,
    bio,
    setBio,
    fontScale,
    setFontScale,
    theme,
    setTheme,
    handlePickAvatar,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
  } = useProfileScreen();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const providerBadge = PROVIDER_BADGE[authData?.providerId ?? 'anonymous'];

  const handleStartEdit = useCallback(() => setIsEditing(true), [setIsEditing]);
  const handleOpenPaywall = useCallback(() => router.push('/paywall' as any), [router]);
  const handleOpenPrivacy = useCallback(() => router.push('/legal?type=privacy' as any), [router]);
  const handleOpenTerms = useCallback(() => router.push('/legal?type=terms' as any), [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={handleStartEdit} hitSlop={HIT_SLOP}>
            <Ionicons name="create-outline" size={22} color={Colors.brand.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleCancelEdit} hitSlop={HIT_SLOP}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={isGuest ? undefined : handlePickAvatar}
          activeOpacity={isGuest ? 1 : 0.7}
        >
          {isGuest ? (
            <View style={styles.avatarPlaceholderGuest}>
              <MaterialCommunityIcons name="incognito" size={48} color={Colors.neutral[400]} />
            </View>
          ) : profile.avatarUri ? (
            <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
            </View>
          )}
          {!isGuest && (
            <View style={styles.avatarBadge}>
              <Ionicons name="pencil" size={13} color={Colors.neutral[700]} />
            </View>
          )}
          <View style={styles.providerBadge}>
            <Ionicons name={providerBadge.icon} size={12} color={Colors.white} />
          </View>
        </TouchableOpacity>
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
                  <PinTextField
                    label="Bio"
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    multiline
                  />
                  <View style={styles.fieldSpacing} />
                  <PinButton title="Save Changes" onPress={handleSave} fullWidth />
                </View>
              ) : (
                <View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  {profile.bio ? (
                    <Text style={styles.profileBio}>{profile.bio}</Text>
                  ) : (
                    <Text style={styles.placeholderBio}>No bio yet. Tap Edit to add one.</Text>
                  )}
                </View>
              )}
            </PinCard>

            {/* Stats */}
            <PinCard style={styles.statsCard}>
              <Text style={styles.statsTitle}>Stats</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{places.length}</Text>
                  <Text style={styles.statLabel}>Places</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{places.filter((p) => p.isFavorite).length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{meetings.length}</Text>
                  <Text style={styles.statLabel}>Meetings</Text>
                </View>
              </View>
            </PinCard>

            {/* Appearance */}
            <PinCard style={styles.appearanceCard}>
              <Text style={styles.infoTitle}>Appearance</Text>
              <Text style={styles.appearanceLabel}>Font Size</Text>
              <View style={styles.chips}>
                {FONT_SCALE_OPTIONS.map((opt) => (
                  <SettingChip
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    active={fontScale === opt.value}
                    onSelect={setFontScale}
                  />
                ))}
              </View>
              <Text style={[styles.appearanceLabel, styles.appearanceLabelSpaced]}>Theme</Text>
              <View style={styles.chips}>
                {THEME_OPTIONS.map((opt) => (
                  <SettingChip
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    active={theme === opt.value}
                    onSelect={setTheme}
                  />
                ))}
              </View>
            </PinCard>

            {/* Billing */}
            <PinCard style={styles.accountCard}>
              <TouchableOpacity style={styles.accountRow} onPress={handleOpenPaywall}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={Colors.neutral[700]}
                  style={styles.accountIcon}
                />
                <Text style={styles.accountRowText}>Payment Method & Billing</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
              </TouchableOpacity>
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
  avatarSection: { alignItems: 'center', paddingBottom: Spacing.s16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderGuest: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: Colors.white },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Spacing.s4,
  },
  profileBio: {
    ...Typography.body,
    color: Colors.neutral[600],
    lineHeight: 22,
  },
  placeholderBio: {
    ...Typography.body,
    color: Colors.neutral[400],
    fontStyle: 'italic',
  },
  statsCard: { marginBottom: 0 },
  statsTitle: {
    ...Typography.headline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s16,
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
  appearanceCard: { marginBottom: 0 },
  appearanceLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    fontWeight: '600',
    marginBottom: Spacing.s8,
  },
  appearanceLabelSpaced: { marginTop: Spacing.s12 },
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
});
