import React, { useCallback, useState } from 'react';
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
  // Which URI failed, rather than a plain boolean: avatarUri can be a remote URL adopted from
  // Google, and those rotate when the user changes their account photo. Remembering the URI
  // means a new one gets its own chance to load instead of inheriting the old one's failure —
  // and needs no effect to reset.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const preset = getAvatarPreset(profile.avatarPreset);
  const commonStyle = { width: size, height: size, borderRadius: size / 2 };

  const handleError = useCallback(
    () => setFailedUri(profile.avatarUri ?? null),
    [profile.avatarUri],
  );

  // A remote avatar has plenty of ways to not arrive — no network on first launch, a URL that
  // has since 404'd. Without this the component rendered an empty circle: avatarUri was
  // truthy, so the preset and initials below were never reached.
  if (profile.avatarUri && profile.avatarUri !== failedUri) {
    return <Image source={{ uri: profile.avatarUri }} style={commonStyle} onError={handleError} />;
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
