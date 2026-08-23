import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../design-system/components/CircleCloseButton';
import { Colors, Spacing, Typography } from '../../design-system/tokens';
import { LEGAL_CONTACT, LEGAL_DOCS, LEGAL_LAST_UPDATED } from '../../shared/legalContent';

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  // The text itself lives in src/shared/legalContent.ts, shared with the public page at
  // /legal that App Store Connect links to — so the two can never drift apart.
  const content = LEGAL_DOCS[type === 'terms' ? 'terms' : 'privacy'];
  const handleClose = useCallback(() => router.back(), [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{content.title}</Text>
        <CircleCloseButton onPress={handleClose} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.contact}>{LEGAL_CONTACT}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.doneBtn}>
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
  updated: { ...Typography.caption, color: Colors.neutral[500], marginBottom: Spacing.s20 },
  section: { marginBottom: Spacing.s20, gap: Spacing.s8 },
  heading: {
    ...Typography.subheadline,
    color: Colors.neutral[900],
    fontWeight: '700',
    marginBottom: Spacing.s8,
  },
  body: { ...Typography.body, color: Colors.neutral[700], lineHeight: 24 },
  contact: {
    ...Typography.caption,
    color: Colors.neutral[500],
    lineHeight: 20,
    marginTop: Spacing.s8,
  },
  doneBtn: {
    marginTop: Spacing.s24,
    alignSelf: 'center',
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s12,
  },
  doneText: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
});
