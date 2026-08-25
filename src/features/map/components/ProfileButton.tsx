import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../../design-system/components/Avatar';
import { Colors, Spacing } from '../../../design-system/tokens';
import { UserProfile } from '../../../models/types';
import { getInitials } from '../../../shared/getInitials';

const AVATAR_SIZE = 44;

interface Props {
  profile: UserProfile;
  onPress: () => void;
}

export function ProfileButton({ profile, onPress }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.btn} onPress={onPress}>
        <Avatar profile={profile} size={AVATAR_SIZE} getInitials={getInitials} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: Spacing.s16,
    paddingRight: Spacing.s16,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
});
