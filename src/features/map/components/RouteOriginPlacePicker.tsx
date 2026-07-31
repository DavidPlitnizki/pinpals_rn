import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { Place } from '../../../models/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

interface Props {
  visible: boolean;
  places: Place[];
  onSelect: (place: Place) => void;
  onClose: () => void;
}

export function RouteOriginPlacePicker({ visible, places, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Start from a place</Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {places.length === 0 ? (
                  <Text style={styles.emptyText}>You have no saved places yet</Text>
                ) : (
                  places.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.placeRow}
                      onPress={() => onSelect(place)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[place.category] }]}
                      />
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <Text style={styles.placeMeta}>{CATEGORY_LABELS[place.category]}</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
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
    maxHeight: '70%',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.s20,
  },
  title: { ...Typography.title3, color: Colors.neutral[900], marginBottom: Spacing.s12 },
  list: {
    flexGrow: 0,
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
    paddingVertical: Spacing.s16,
    textAlign: 'center',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    gap: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    ...Typography.callout,
    color: Colors.neutral[900],
    fontWeight: '600',
    marginBottom: 2,
  },
  placeMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  chevron: {
    fontSize: 20,
    color: Colors.neutral[300],
    lineHeight: 24,
  },
});
