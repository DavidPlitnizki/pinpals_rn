import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { HOURS, MINUTES, MONTHS } from '../constants';

interface Props {
  visible: boolean;
  tempDay: number;
  tempMonth: number;
  tempYear: number;
  tempHour: number;
  tempMinute: number;
  getDaysInMonth: (month: number, year: number) => number;
  onChangeDay: (d: number) => void;
  onChangeMonth: (m: number) => void;
  onChangeYear: (y: number) => void;
  onChangeHour: (h: number) => void;
  onChangeMinute: (m: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function DatePickerModal({
  visible,
  tempDay,
  tempMonth,
  tempYear,
  tempHour,
  tempMinute,
  getDaysInMonth,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  onChangeHour,
  onChangeMinute,
  onConfirm,
  onClose,
}: Props) {
  const years = [
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
    new Date().getFullYear() + 2,
  ];
  const daysInMonth = getDaysInMonth(tempMonth, tempYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Set Date & Time</Text>
          <TouchableOpacity onPress={onConfirm}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Date</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Month</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.item, tempMonth === idx && styles.itemSelected]}
                    onPress={() => {
                      onChangeMonth(idx);
                      const maxDays = getDaysInMonth(idx, tempYear);
                      if (tempDay > maxDays) onChangeDay(maxDays);
                    }}
                  >
                    <Text style={[styles.itemText, tempMonth === idx && styles.itemTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.column}>
              <Text style={styles.columnLabel}>Day</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.item, tempDay === d && styles.itemSelected]}
                    onPress={() => onChangeDay(d)}
                  >
                    <Text style={[styles.itemText, tempDay === d && styles.itemTextSelected]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.column}>
              <Text style={styles.columnLabel}>Year</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.item, tempYear === y && styles.itemSelected]}
                    onPress={() => onChangeYear(y)}
                  >
                    <Text style={[styles.itemText, tempYear === y && styles.itemTextSelected]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.section}>Time</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Hour</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.item, tempHour === h && styles.itemSelected]}
                    onPress={() => onChangeHour(h)}
                  >
                    <Text style={[styles.itemText, tempHour === h && styles.itemTextSelected]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.column}>
              <Text style={styles.columnLabel}>Minute</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.item, tempMinute === m && styles.itemSelected]}
                    onPress={() => onChangeMinute(m)}
                  >
                    <Text style={[styles.itemText, tempMinute === m && styles.itemTextSelected]}>
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  title: { ...Typography.headline, color: Colors.neutral[900] },
  cancel: { ...Typography.body, color: Colors.neutral[500] },
  done: { ...Typography.body, color: Colors.brand.primary, fontWeight: '600' },
  content: { padding: Spacing.s20, paddingBottom: Spacing.s48 },
  section: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
    marginTop: Spacing.s8,
  },
  row: { flexDirection: 'row', gap: Spacing.s12, marginBottom: Spacing.s16 },
  column: { flex: 1 },
  columnLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.s4,
  },
  scroll: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
  },
  item: { paddingVertical: Spacing.s8, paddingHorizontal: Spacing.s8, alignItems: 'center' },
  itemSelected: { backgroundColor: Colors.brand.light },
  itemText: { ...Typography.body, color: Colors.neutral[700] },
  itemTextSelected: { color: Colors.brand.dark, fontWeight: '700' },
});
