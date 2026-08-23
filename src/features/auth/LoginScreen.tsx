import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { SocialButtons } from './components/SocialButtons';
import { useLoginScreen } from './hooks/useLoginScreen';

const DROP_SIZE = 40;
// Staggered so the five pins pop in one after another instead of all at once.
const PIN_STAGGER_MS = 130;

// Shared entrance: scales up from nothing with a springy (non-linear) overshoot, while also
// kicking sideways from an offset back to center with a looser, wobblier spring — the two
// running concurrently is what reads as "grows in with a left-right jiggle" rather than a
// plain scale-in.
function usePinEntrance(delay: number) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(-14);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 9, stiffness: 200 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 3.5, stiffness: 160, mass: 0.5 }));
  }, [delay, scale, translateX]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));
}

interface DecorPinProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  style: object;
  delay: number;
}

// Decorative map-pin markers scattered above the background image's own logo — same drop +
// white icon-badge shape used for real place pins on the map (see MapMarkers.tsx), just
// smaller and non-interactive.
function DecorPin({ icon, color, style, delay }: DecorPinProps) {
  const animatedStyle = usePinEntrance(delay);
  return (
    <Animated.View style={[styles.decorPin, style, animatedStyle]} pointerEvents="none">
      <Ionicons name="location-sharp" size={DROP_SIZE} color={color} />
      <View style={styles.decorPinBadge}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
    </Animated.View>
  );
}

interface DecorPinMciProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  style: object;
  delay: number;
}

// Same shape as DecorPin, for the two markers whose closest icon lives in
// MaterialCommunityIcons instead of Ionicons (castle, parking — matches the icon set already
// used for these same categories in the map's quick-search chips).
function DecorPinMci({ icon, color, style, delay }: DecorPinMciProps) {
  const animatedStyle = usePinEntrance(delay);
  return (
    <Animated.View style={[styles.decorPin, style, animatedStyle]} pointerEvents="none">
      <Ionicons name="location-sharp" size={DROP_SIZE} color={color} />
      <View style={styles.decorPinBadge}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
      </View>
    </Animated.View>
  );
}

// "Skip for now"'s position is set purely by its distance from the legal block below it
// (justifyContent: flex-end anchors that block to the bottom, so nothing above it moves
// Skip itself) — a flat Spacing constant wouldn't scale with device height the way a
// screen-relative offset does. marginTop just closes the gap up to the buttons above.
const SKIP_LIFT_RATIO = 0.045;

// The background image's baked-in tagline sits just above where this column starts. On a
// 4.7" screen (SE) the image is cropped harder by `cover` while the column keeps its full
// height, so the lift pushes the buttons up over that tagline — drop it there and let the
// column sit flush at the bottom instead.
const SHORT_SCREEN_HEIGHT = 700;

export default function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const skipLift = windowHeight < SHORT_SCREEN_HEIGHT ? 0 : windowHeight * SKIP_LIFT_RATIO;
  const {
    isLoading,
    error,
    handleGooglePress,
    handleApplePress,
    handleSkip,
    goToTerms,
    goToPrivacy,
  } = useLoginScreen();

  return (
    <ImageBackground
      source={require('../../../assets/images/splash-screen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Restaurant (left, roughly centered), park and shop (right, staggered heights),
          landmark (below-left of restaurant), parking (just above/right of the logo) —
          scattered above the logo baked into the background image. */}
      <DecorPin
        icon="restaurant"
        color="#E8834A"
        style={styles.decorPinLeft}
        delay={0 * PIN_STAGGER_MS}
      />
      <DecorPin
        icon="leaf"
        color="#4A7C59"
        style={styles.decorPinRightHigh}
        delay={1 * PIN_STAGGER_MS}
      />
      <DecorPin
        icon="storefront"
        color="#3D9BE9"
        style={styles.decorPinRightLow}
        delay={2 * PIN_STAGGER_MS}
      />
      <DecorPinMci
        icon="castle"
        color="#607D8B"
        style={styles.decorPinLandmark}
        delay={3 * PIN_STAGGER_MS}
      />
      <DecorPinMci
        icon="parking"
        color="#6C63FF"
        style={styles.decorPinParking}
        delay={4 * PIN_STAGGER_MS}
      />

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* The background image already carries the logo/title/tagline — content here just
            sits in its lower, empty portion. */}
        <View style={styles.content}>
          <View style={styles.social}>
            <SocialButtons
              onGooglePress={handleGooglePress}
              onApplePress={handleApplePress}
              disabled={isLoading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            style={[styles.skipButtonWrap, { marginBottom: skipLift }]}
          >
            <View style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for now</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.legalBlock}>
            <Text style={styles.legalDisclaimer}>By continuing, you agree to our</Text>
            <View style={styles.legalRow}>
              <TouchableOpacity onPress={goToTerms}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>·</Text>
              <TouchableOpacity onPress={goToPrivacy}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // Off-white with a warm vanilla tint, matching the map illustration's own background —
    // not the splash screen's yellow.
    backgroundColor: '#F7F2E7',
  },
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.s24,
    paddingBottom: Spacing.s32,
    // Matches SocialButtons' own internal gap (Google↔Apple), so the whole stack —
    // Google, Apple, Skip, legal — reads as one evenly spaced column instead of the
    // buttons themselves sitting closer together than everything below them.
    gap: Spacing.s12,
  },
  decorPin: {
    position: 'absolute',
    width: DROP_SIZE,
    height: DROP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  decorPinBadge: {
    position: 'absolute',
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Left pin sits closer to center than the screen edge; the two right pins are staggered,
  // one noticeably higher than the other.
  decorPinLeft: {
    top: '16%',
    left: '32%',
  },
  decorPinRightHigh: {
    top: '9%',
    right: '20%',
  },
  decorPinRightLow: {
    top: '20%',
    right: '14%',
  },
  decorPinLandmark: {
    top: '26%',
    left: '14%',
  },
  decorPinParking: {
    top: '25%',
    left: '46%',
  },
  social: {
    gap: Spacing.s16,
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.error,
    textAlign: 'center',
  },
  skipButtonWrap: {
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: Spacing.s32,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  skipText: {
    ...Typography.headline,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  legalBlock: {
    alignItems: 'center',
    gap: Spacing.s4,
  },
  legalDisclaimer: {
    ...Typography.caption,
    color: Colors.neutral[600],
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  legalLink: {
    ...Typography.footnote,
    color: Colors.brand.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
});
