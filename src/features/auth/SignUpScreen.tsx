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
import { Colors, Spacing, Typography } from '../../design-system/tokens';
import { AuthDivider } from './components/AuthDivider';
import { SocialButtons } from './components/SocialButtons';
import { useSignUpScreen } from './hooks/useSignUpScreen';

export default function SignUpScreen() {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSignUp,
    handleGooglePress,
    handleApplePress,
    goToLogin,
  } = useSignUpScreen();

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goToLogin} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <PinTextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
            />
            <View style={styles.fieldGap} />
            <PinTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <View style={styles.fieldGap} />
            <PinTextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.fieldGap} />
            <PinButton
              title="Create Account"
              onPress={handleSignUp}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            />
          </View>

          {/* Social */}
          <View style={styles.social}>
            <AuthDivider />
            <View style={styles.socialButtons}>
              <SocialButtons onGooglePress={handleGooglePress} onApplePress={handleApplePress} />
            </View>
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  header: {
    marginBottom: Spacing.s32,
  },
  backButton: {
    marginBottom: Spacing.s16,
  },
  backText: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  title: {
    ...Typography.title2,
    color: Colors.neutral[900],
  },
  form: {
    marginBottom: Spacing.s24,
  },
  fieldGap: { height: Spacing.s16 },
  errorText: {
    ...Typography.footnote,
    color: Colors.error,
    marginTop: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  social: {
    marginBottom: Spacing.s8,
    gap: Spacing.s16,
  },
  socialButtons: {
    marginTop: Spacing.s4,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.s24,
  },
  loginPrompt: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
  },
  loginLink: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
});
