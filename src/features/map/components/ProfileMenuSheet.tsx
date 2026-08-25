import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../../design-system/components/Avatar';
import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { PinButton } from '../../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place, UserProfile } from '../../../models/types';
import { getInitials } from '../../../shared/getInitials';

const AVATAR_SIZE = 64;

interface Props {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  places: Place[];
}

export function ProfileMenuSheet({ visible, onClose, profile, places }: Props) {
  const router = useRouter();

  const handleViewFullProfile = useCallback(() => {
    onClose();
    router.push('/(tabs)/profile' as any);
  }, [onClose, router]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <CircleCloseButton onPress={onClose} />
        </View>

        <View style={styles.content}>
          <View style={styles.avatarRow}>
            <Avatar profile={profile} size={AVATAR_SIZE} getInitials={getInitials} />
            <View style={styles.nameCol}>
              <Text style={styles.name}>{profile.name}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{places.length}</Text>
              <Text style={styles.statLbl}>Places</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{places.filter((p) => p.favorite).length}</Text>
              <Text style={styles.statLbl}>Favorites</Text>
            </View>
          </View>

          <PinButton title="View Full Profile" fullWidth onPress={handleViewFullProfile} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  title: { ...Typography.title3, color: Colors.neutral[900] },
  content: { padding: Spacing.s20, gap: Spacing.s20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s16 },
  nameCol: { flex: 1 },
  name: { ...Typography.title3, color: Colors.neutral[900] },
  stats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...Typography.title2, color: Colors.brand.primary, marginBottom: Spacing.s4 },
  statLbl: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.neutral[100] },
});
