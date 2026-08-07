import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../design-system/tokens';
import { Coordinates } from '../../../models/types';
import { RoundMapButton } from './RoundMapButton';

interface Props {
  gpsCoords: Coordinates | null;
  onCenterGPS: () => void;
  onAdd: () => void;
  onSearch: () => void;
  onFlyTo: () => void;
}

const FAB_SIZE = 56;

export function MapControls({ gpsCoords, onCenterGPS, onAdd, onSearch, onFlyTo }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <View style={styles.cluster}>
        <RoundMapButton onPress={onFlyTo} color={Colors.brand.primary} size={FAB_SIZE}>
          <Ionicons name="airplane" size={22} color={Colors.white} style={styles.flyToIcon} />
        </RoundMapButton>
        <RoundMapButton onPress={onSearch} color={Colors.brand.primary} size={FAB_SIZE}>
          <Ionicons name="search" size={26} color={Colors.white} />
        </RoundMapButton>
        <RoundMapButton
          onPress={onCenterGPS}
          color={Colors.brand.primary}
          size={FAB_SIZE}
          disabled={!gpsCoords}
        >
          <Ionicons name="locate" size={26} color={Colors.white} />
        </RoundMapButton>
        <RoundMapButton onPress={onAdd} color={Colors.brand.primary} size={FAB_SIZE}>
          <Text style={styles.fabText}>+</Text>
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
    paddingBottom: Spacing.s24,
    paddingRight: Spacing.s16,
  },
  cluster: { alignItems: 'center', gap: Spacing.s12 },
  // Tilted nose-up, like a plane climbing right after takeoff, instead of the flat glyph default.
  flyToIcon: { transform: [{ rotate: '-45deg' }] },
  fabText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    fontWeight: '400',
  },
});
