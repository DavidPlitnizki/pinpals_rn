import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { Coordinates } from '../../../models/types';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  gpsCoords: Coordinates | null;
  onCenterGPS: () => void;
  onFlyTo: () => void;
  onOpenStyles: () => void;
}

const FAB_SIZE = 56;

// Gap between the safe area and the bottom of the cluster. Exported because MapCardSheet lines
// the card's bottom edge up with these buttons, so the two sit on one shelf.
export const CONTROLS_BOTTOM_GAP = Spacing.s24;

export function MapControls({ gpsCoords, onCenterGPS, onFlyTo, onOpenStyles }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <View style={styles.cluster}>
        {/* Topmost of the cluster: switching the base map is the least frequent of these
            actions, so it sits furthest from the thumb. */}
        <RoundMapButton onPress={onOpenStyles} color={Colors.brand.primary} size={FAB_SIZE}>
          <Ionicons name="layers-outline" size={24} color={Colors.white} />
        </RoundMapButton>
        <RoundMapButton onPress={onFlyTo} color={Colors.brand.primary} size={FAB_SIZE}>
          <Ionicons name="airplane" size={22} color={Colors.white} style={styles.flyToIcon} />
        </RoundMapButton>
        {/* Bottom of the cluster, nearest the thumb: recentring is the most frequent of
            these. The "+" that used to sit below it is gone — a place is added by long-
            pressing where it belongs on the map, not from the map's current centre. */}
        <RoundMapButton
          onPress={onCenterGPS}
          color={Colors.brand.primary}
          size={FAB_SIZE}
          disabled={!gpsCoords}
        >
          <Ionicons name="locate" size={26} color={Colors.white} />
        </RoundMapButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingBottom: CONTROLS_BOTTOM_GAP,
    paddingRight: Spacing.s16,
  },
  cluster: { alignItems: 'center', gap: Spacing.s12 },
  // Tilted nose-up, like a plane climbing right after takeoff, instead of the flat glyph default.
  flyToIcon: { transform: [{ rotate: '-45deg' }] },
});
