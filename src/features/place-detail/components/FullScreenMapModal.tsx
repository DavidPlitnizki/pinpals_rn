import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { HIT_SLOP_8 } from '../../map/constants';
import { PlaceMapSnapshot } from './PlaceMapSnapshot';

interface Props {
  visible: boolean;
  placeId: string;
  latitude: number;
  longitude: number;
  pinColor: string;
  name: string;
  onClose: () => void;
}

// The map page of the hero gallery, opened full screen — pannable/zoomable here, unlike the
// static header version.
export function FullScreenMapModal({
  visible,
  placeId,
  latitude,
  longitude,
  pinColor,
  name,
  onClose,
}: Props) {
  // SafeAreaView reports zero insets inside a Modal on iOS (same issue PhotoViewerModal
  // documents), so the close button is positioned from the screen's own insets instead.
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <PlaceMapSnapshot
          id={`${placeId}-fullscreen`}
          latitude={latitude}
          longitude={longitude}
          color={pinColor}
          interactive
        />

        <View style={[styles.header, { top: insets.top + Spacing.s12 }]} pointerEvents="box-none">
          <View style={styles.namePill}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={HIT_SLOP_8}>
            <Ionicons name="close" size={22} color={Colors.neutral[900]} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[100] },
  header: {
    position: 'absolute',
    left: Spacing.s16,
    right: Spacing.s16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s12,
  },
  namePill: {
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
  },
  name: { ...Typography.headline, color: Colors.neutral[900] },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
