import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../design-system/components/CircleCloseButton';
import { PinButton } from '../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';

type PlanId = 'monthly' | 'yearly';

const PLANS: { id: PlanId; label: string; price: string; badge?: string }[] = [
  { id: 'yearly', label: 'Yearly', price: '$29.99 / year', badge: 'Best value' },
  { id: 'monthly', label: 'Monthly', price: '$3.99 / month' },
];

const PERKS = [
  'Unlimited saved places & memories',
  'Unlimited photos per memory',
  'Priority support',
  'Early access to new features',
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>('yearly');

  function handleSubscribe() {
    Alert.alert('Coming soon', 'Payments are not available yet — check back soon!');
  }

  function handleRestore() {
    Alert.alert('Coming soon', 'Restoring purchases is not available yet.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <CircleCloseButton onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Ionicons name="sparkles" size={40} color={Colors.brand.primary} />
        <Text style={styles.title}>Pinpals Plus</Text>
        <Text style={styles.subtitle}>Unlock the full atlas of your life</Text>

        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.brand.primary} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, active && styles.planCardActive]}
                onPress={() => setSelected(plan.id)}
              >
                <View style={styles.planTextGroup}>
                  <View style={styles.planLabelRow}>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    {plan.badge && (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={active ? Colors.brand.primary : Colors.neutral[300]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <PinButton title="Subscribe" onPress={handleSubscribe} fullWidth size="lg" />
        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions are not yet available for purchase. Pricing shown is illustrative and
          subject to change.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s8,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.s24,
    paddingTop: Spacing.s8,
    gap: Spacing.s12,
  },
  title: { ...Typography.title1, color: Colors.neutral[900] },
  subtitle: {
    ...Typography.body,
    color: Colors.neutral[500],
    marginBottom: Spacing.s12,
    textAlign: 'center',
  },
  perks: { width: '100%', gap: Spacing.s12, marginBottom: Spacing.s16 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s8 },
  perkText: { ...Typography.body, color: Colors.neutral[700], flex: 1 },
  plans: { width: '100%', gap: Spacing.s12, marginBottom: Spacing.s16 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
    padding: Spacing.s16,
    backgroundColor: Colors.white,
  },
  planCardActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  planTextGroup: { gap: Spacing.s4 },
  planLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s8 },
  planLabel: { ...Typography.headline, color: Colors.neutral[900] },
  planBadge: {
    backgroundColor: Colors.accent.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 2,
  },
  planBadgeText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  planPrice: { ...Typography.subheadline, color: Colors.neutral[600] },
  restoreBtn: { marginTop: Spacing.s4, padding: Spacing.s8 },
  restoreText: { ...Typography.subheadline, color: Colors.brand.primary, fontWeight: '600' },
  disclaimer: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: Spacing.s8,
  },
});
