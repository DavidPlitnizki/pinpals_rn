import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinButton } from '../../design-system/components/PinButton';
import { PinTextField } from '../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { useResetPasswordScreen } from './hooks/useResetPasswordScreen';

export default function ResetPasswordScreen() {
  const { email, setEmail, isLoading, isSuccess, error, handleSendReset, goToLogin } =
    useResetPasswordScreen();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSuccess ? (
            <SuccessState email={email} onBack={goToLogin} />
          ) : (
            <FormState
              email={email}
              setEmail={setEmail}
              isLoading={isLoading}
              error={error}
              onSend={handleSendReset}
              onBack={goToLogin}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormStateProps {
  email: string;
  setEmail: (v: string) => void;
  isLoading: boolean;
  error: string | null;
  onSend: () => void;
  onBack: () => void;
}

function FormState({ email, setEmail, isLoading, error, onSend, onBack }: FormStateProps) {
  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Back to Login</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </Text>

      <View style={styles.formSection}>
        <PinTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.fieldGap} />
        <PinButton
          title="Send Reset Link"
          onPress={onSend}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        />
      </View>
    </View>
  );
}

interface SuccessStateProps {
  email: string;
  onBack: () => void;
}

function SuccessState({ email, onBack }: SuccessStateProps) {
  return (
    <View style={styles.successContainer}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkmark}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Check your email</Text>
      <Text style={styles.successSubtitle}>We sent a reset link to</Text>
      <Text style={styles.successEmail}>{email}</Text>
      <View style={styles.successButton}>
        <PinButton title="Back to Login" onPress={onBack} variant="primary" size="lg" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.s24,
    paddingTop: Spacing.s24,
    paddingBottom: Spacing.s32,
  },
  backButton: {
    marginBottom: Spacing.s24,
  },
  backText: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  title: {
    ...Typography.title2,
    color: Colors.neutral[900],
    marginBottom: Spacing.s8,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    lineHeight: 22,
    marginBottom: Spacing.s32,
  },
  formSection: {
    gap: Spacing.s4,
  },
  fieldGap: { height: Spacing.s12 },
  errorText: {
    ...Typography.footnote,
    color: Colors.error,
    marginTop: Spacing.s8,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.s48,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s24,
  },
  checkmark: {
    fontSize: 36,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  successTitle: {
    ...Typography.title2,
    color: Colors.neutral[900],
    marginBottom: Spacing.s8,
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  successEmail: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
    marginBottom: Spacing.s32,
  },
  successButton: {
    width: '100%',
  },
});
