import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { UserProfile } from '../../models/types';
import { getAvatarPreset } from '../../shared/avatarPresets';
import { Colors } from '../tokens';

interface Props {
  profile: UserProfile;
  size: number;
  getInitials: (name: string) => string;
}

// Single source of truth for "what does this user's avatar look like" — a photo, a preset
// icon, or initials as the final fallback. Used by ProfileScreen, ProfileButton, and
// ProfileMenuSheet so all three stay in sync as avatar options grow.
export function Avatar({ profile, size, getInitials }: Props) {
  const preset = getAvatarPreset(profile.avatarPreset);
  const commonStyle = { width: size, height: size, borderRadius: size / 2 };

  if (profile.avatarUri) {
    return <Image source={{ uri: profile.avatarUri }} style={commonStyle} />;
  }

  if (preset) {
    return (
      <View style={[styles.presetWrap, commonStyle, { backgroundColor: preset.color }]}>
        <Text style={{ fontSize: size * 0.52 }}>{preset.emoji}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.initialsWrap, commonStyle]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
        {getInitials(profile.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  presetWrap: { alignItems: 'center', justifyContent: 'center' },
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary,
  },
  initialsText: { fontWeight: '700', color: Colors.white },
});
