import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinButton } from '../../design-system/components/PinButton';
import { PinCard } from '../../design-system/components/PinCard';
import { PinTextField } from '../../design-system/components/PinTextField';

export default function ProfileScreen() {
  const { profile, places, meetings, updateProfile } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? '');

  function getInitials(n: string): string {
    return n
      .split(' ')
      .map((word) => word[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile({ name: name.trim(), bio: bio.trim() || undefined });
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setName(profile.name);
    setBio(profile.bio ?? '');
    setIsEditing(false);
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>✏</Text>
              </View>
            </TouchableOpacity>
          </View>

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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phase</Text>
              <Text style={styles.infoValue}>1 — Solo Features</Text>
            </View>
          </PinCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s16,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.neutral[900],
  },
  editLink: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  cancelLink: {
    ...Typography.body,
    color: Colors.neutral[500],
  },
  content: {
    padding: Spacing.s16,
    gap: Spacing.s16,
    paddingBottom: Spacing.s48,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.s8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
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
  avatarBadgeText: {
    fontSize: 12,
  },
  profileCard: {
    marginBottom: 0,
  },
  editForm: {
    gap: Spacing.s4,
  },
  fieldSpacing: {
    height: Spacing.s4,
  },
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
  statsCard: {
    marginBottom: 0,
  },
  statsTitle: {
    ...Typography.headline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.neutral[100],
  },
  infoCard: {
    marginBottom: 0,
  },
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
  infoLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
  },
  infoValue: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
  },
});
