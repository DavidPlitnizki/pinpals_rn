import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MAP_STYLES, MapStyleId, MapStyleOption } from '../mapStyles';

const WINDOW_HEIGHT = Dimensions.get('window').height;
// Five short rows — the sheet grows to fit them rather than claiming a fixed slice of the
// screen, matching how FiltersSheet handles a similarly small amount of content.
const MAX_SHEET_HEIGHT = WINDOW_HEIGHT * 0.7;
const ANIMATION_DURATION = 260;

interface RowProps {
  option: MapStyleOption;
  selected: boolean;
  onSelect: (id: MapStyleId) => void;
}

const StyleRow = React.memo(function StyleRow({ option, selected, onSelect }: RowProps) {
  const handlePress = useCallback(() => onSelect(option.id), [onSelect, option.id]);

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={option.icon}
          size={22}
          color={selected ? Colors.white : Colors.brand.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>{option.label}</Text>
        <Text style={styles.rowDescription} numberOfLines={1}>
          {option.description}
        </Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.brand.primary} />}
    </TouchableOpacity>
  );
});

interface Props {
  visible: boolean;
  styleId: MapStyleId;
  onSelect: (id: MapStyleId) => void;
  onClose: () => void;
}

export function MapStyleSheet({ visible, styleId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(MAX_SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      translateY.setValue(MAX_SHEET_HEIGHT);
    }
  }, [visible, backdropOpacity, translateY]);

  // Animates out first, then tells the parent — otherwise the sheet vanishes instantly.
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: MAX_SHEET_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [backdropOpacity, translateY, onClose]);

  // Picking a style is a one-tap decision, so the sheet closes itself — no Apply button to
  // press afterwards. The map underneath has already changed by the time it slides away.
  const handleSelect = useCallback(
    (id: MapStyleId) => {
      onSelect(id);
      handleClose();
    },
    [onSelect, handleClose],
  );

  const sheetStyle = useMemo(
    () => [
      styles.sheet,
      {
        maxHeight: MAX_SHEET_HEIGHT,
        paddingBottom: insets.bottom + Spacing.s16,
        transform: [{ translateY }],
      },
    ],
    [translateY, insets.bottom],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={sheetStyle}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Map style</Text>
            <CircleCloseButton onPress={handleClose} />
          </View>

          <View style={styles.list}>
            {MAP_STYLES.map((option) => (
              <StyleRow
                key={option.id}
                option={option}
                selected={option.id === styleId}
                onSelect={handleSelect}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  handleRow: { alignItems: 'center', paddingTop: Spacing.s8 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  // Same width as the close button so the title stays optically centred.
  headerSpacer: { width: 28 },
  title: { ...Typography.headline, color: Colors.neutral[900] },
  list: { paddingHorizontal: Spacing.s16, gap: Spacing.s8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    padding: Spacing.s12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral[100],
  },
  rowSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: Colors.brand.primary },
  rowText: { flex: 1 },
  rowLabel: { ...Typography.body, color: Colors.neutral[900], fontWeight: '600' },
  rowLabelSelected: { color: Colors.brand.dark },
  rowDescription: { ...Typography.caption, color: Colors.neutral[500], marginTop: 1 },
});
