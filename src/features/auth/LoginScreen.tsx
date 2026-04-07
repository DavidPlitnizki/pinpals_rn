import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinButton } from "../../design-system/components/PinButton";
import { PinTextField } from "../../design-system/components/PinTextField";
import { Colors, Spacing, Typography } from "../../design-system/tokens";
import { AuthDivider } from "./components/AuthDivider";
import { SocialButtons } from "./components/SocialButtons";
import { useLoginScreen } from "./hooks/useLoginScreen";

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleGooglePress,
    handleApplePress,
    handleSkip,
    goToSignUp,
    goToResetPassword,
  } = useLoginScreen();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoRow}>
              <Image
                source={require("../../../assets/images/pinpals-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoTitle}>Pinpals</Text>
            </View>
            <Text style={styles.tagline}>Your places, your memories</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
              autoComplete="password"
            />

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={goToResetPassword}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PinButton
              title="Log In"
              onPress={handleLogin}
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
              <SocialButtons
                onGooglePress={handleGooglePress}
                onApplePress={handleApplePress}
              />
            </View>
          </View>

          {/* Skip */}
          <PinButton
            title="Skip for now"
            onPress={handleSkip}
            variant="ghost"
            fullWidth
          />

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToSignUp}>
              <Text style={styles.signUpLink}>Sign up</Text>
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
    paddingTop: Spacing.s48,
    paddingBottom: Spacing.s32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.s48,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s8,
    gap: Spacing.s12,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginInlineStart: -12,
  },
  logoTitle: {
    ...Typography.largeTitle,
    color: Colors.brand.primary,
  },
  tagline: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
  },
  form: {
    marginBottom: Spacing.s24,
  },
  fieldGap: { height: Spacing.s16 },
  forgotRow: {
    alignItems: "flex-end",
    marginTop: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  forgotText: {
    ...Typography.footnote,
    color: Colors.brand.primary,
    fontWeight: "600",
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.error,
    marginBottom: Spacing.s12,
  },
  social: {
    marginBottom: Spacing.s8,
    gap: Spacing.s16,
  },
  socialButtons: {
    marginTop: Spacing.s4,
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.s24,
  },
  signUpPrompt: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
  },
  signUpLink: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    fontWeight: "600",
  },
});
