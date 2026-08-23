import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { RELEASE_NOTES } from '../../../shared/releaseNotes';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Full release history, newest first — tapping the version row in Profile opens this
// instead of a single-version popup, so re-opening it later still shows past entries too.
export function WhatsNewModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s New</Text>
          <CircleCloseButton onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {RELEASE_NOTES.map((entry) => (
            <View key={entry.version} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryVersion}>Version {entry.version}</Text>
                <Text style={styles.entryDate}>{entry.date}</Text>
              </View>
              {entry.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  content: { padding: Spacing.s20, gap: Spacing.s24 },
  entry: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    gap: Spacing.s12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  entryVersion: { ...Typography.title3, color: Colors.neutral[900] },
  entryDate: { ...Typography.footnote, color: Colors.neutral[400] },
  featureRow: { flexDirection: 'row', gap: Spacing.s8 },
  featureBullet: { ...Typography.body, color: Colors.brand.primary },
  featureText: { ...Typography.body, color: Colors.neutral[700], flex: 1 },
});
