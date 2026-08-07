import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { PinButton } from '../../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';

interface Props {
  visible: boolean;
  query: string;
  loading: boolean;
  error: string | null;
  onChangeQuery: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function FlyToSheet({
  visible,
  query,
  loading,
  error,
  onChangeQuery,
  onSubmit,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <CircleCloseButton onPress={onClose} style={styles.closeButton} />
              <Ionicons name="airplane" size={28} color={Colors.brand.primary} />
              <Text style={styles.title}>Fly to a place</Text>
              <Text style={styles.subtitle}>
                Enter a city, country, or coordinates (&quot;lat, lng&quot;) to explore what&apos;s
                nearby from there.
              </Text>

              <TextInput
                style={styles.input}
                value={query}
                onChangeText={onChangeQuery}
                placeholder="e.g. Lisbon, Portugal or 38.7223, -9.1393"
                placeholderTextColor={Colors.neutral[400]}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <PinButton title="Cancel" variant="secondary" onPress={onClose} fullWidth />
                </View>
                <View style={styles.actionButton}>
                  {loading ? (
                    <View style={styles.loadingSlot}>
                      <ActivityIndicator color={Colors.brand.primary} />
                    </View>
                  ) : (
                    <PinButton title="Go" onPress={onSubmit} disabled={!query.trim()} fullWidth />
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.s20,
    position: 'relative',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.s12,
    right: Spacing.s12,
  },
  title: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginTop: Spacing.s8,
  },
  subtitle: {
    ...Typography.footnote,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing.s4,
    marginBottom: Spacing.s16,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s12,
    ...Typography.body,
    color: Colors.neutral[900],
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.s8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s20,
    width: '100%',
  },
  actionButton: { flex: 1 },
  loadingSlot: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
