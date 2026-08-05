import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../design-system/components/CircleCloseButton';
import { Colors, Spacing, Typography } from '../../design-system/tokens';

type LegalType = 'privacy' | 'terms';

const CONTENT: Record<LegalType, { title: string; body: string }> = {
  privacy: {
    title: 'Privacy Policy',
    body: `Last updated: ${new Date().getFullYear()}

Pinpals stores the places, notes, photos, and meetings you create locally on your device. Account data (email, display name) is managed through Firebase Authentication solely to sign you in.

We do not sell your data, and we do not share it with third parties except the infrastructure providers (e.g. Firebase, Mapbox) required to operate core features like maps and sign-in.

This app is provided for personal use "as is," without warranty of any kind. To the fullest extent permitted by law, the developer disclaims all liability for any loss or damage arising from your use of the app, including but not limited to data loss, service interruptions, or inaccuracies in map or location data.

You are responsible for backing up any information you consider important. Continued use of the app constitutes acceptance of this policy, which may be updated from time to time.

For questions, contact the developer through the app store listing.`,
  },
  terms: {
    title: 'Terms of Service',
    body: `Last updated: ${new Date().getFullYear()}

By using Pinpals, you agree to use the app for lawful, personal purposes only.

The app is provided "as is" and "as available," without warranties of any kind, express or implied, including but not limited to fitness for a particular purpose, accuracy, or uninterrupted availability.

To the maximum extent permitted by applicable law, the developer shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of, or inability to use, the app — including but not limited to data loss, missed meetings, or reliance on map/directions data.

Features described as in development or "coming soon" (including payments and social features) are not guaranteed to ship on any particular timeline.

The developer reserves the right to modify or discontinue the app or these terms at any time without prior notice.

For questions, contact the developer through the app store listing.`,
  },
};

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const content = CONTENT[type === 'terms' ? 'terms' : 'privacy'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{content.title}</Text>
        <CircleCloseButton onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{content.body}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: { ...Typography.headline, color: Colors.neutral[900] },
  content: { padding: Spacing.s20, paddingBottom: Spacing.s48 },
  body: { ...Typography.body, color: Colors.neutral[700], lineHeight: 24 },
  doneBtn: {
    marginTop: Spacing.s24,
    alignSelf: 'center',
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s12,
  },
  doneText: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
});
