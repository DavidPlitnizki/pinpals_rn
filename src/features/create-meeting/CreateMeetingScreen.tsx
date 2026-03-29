import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAppStore } from '../../store/useAppStore';
import { Colors, Spacing, Radii, Typography } from '../../design-system/tokens';
import { PinButton } from '../../design-system/components/PinButton';
import { PinTextField } from '../../design-system/components/PinTextField';
import { Coordinates } from '../../models/types';

const DEFAULT_COORDS: Coordinates = { latitude: 40.785091, longitude: -73.968285 };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function CreateMeetingScreen() {
  const router = useRouter();
  const { addMeeting } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  const [date, setDate] = useState(tomorrow);

  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDay, setTempDay] = useState(tomorrow.getDate());
  const [tempMonth, setTempMonth] = useState(tomorrow.getMonth());
  const [tempYear, setTempYear] = useState(tomorrow.getFullYear());
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);

  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_COORDS);

  function handleMapPress(event: MapPressEvent) {
    setCoordinates(event.nativeEvent.coordinate);
  }

  function openDateModal() {
    setTempDay(date.getDate());
    setTempMonth(date.getMonth());
    setTempYear(date.getFullYear());
    setTempHour(date.getHours());
    setTempMinute(date.getMinutes());
    setShowDateModal(true);
  }

  function confirmDate() {
    const newDate = new Date(tempYear, tempMonth, tempDay, tempHour, tempMinute);
    setDate(newDate);
    setShowDateModal(false);
  }

  function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the meeting.');
      return;
    }
    addMeeting({
      title: title.trim(),
      description: description.trim() || undefined,
      coordinates,
      date: date.toISOString(),
    });
    router.back();
  }

  const daysInMonth = getDaysInMonth(tempMonth, tempYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = [new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <PinTextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Meeting title"
          />
        </View>

        <View style={styles.formGroup}>
          <PinTextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What's this meeting about? (optional)"
            multiline
          />
        </View>

        {/* Date & Time */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Date & Time</Text>
          <TouchableOpacity style={styles.dateButton} onPress={openDateModal}>
            <Text style={styles.dateButtonIcon}>📅</Text>
            <Text style={styles.dateButtonText}>
              {date.toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Location */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Location</Text>
          <Text style={styles.mapHint}>Tap on the map to set the meeting point</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
          >
            <Marker coordinate={coordinates} pinColor={Colors.brand.primary} />
          </MapView>
          <Text style={styles.coordsText}>
            {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
          </Text>
        </View>

        <View style={styles.saveButton}>
          <PinButton
            title="Create Meeting"
            onPress={handleSave}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Date/Time Picker Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDateModal(false)}
      >
        <SafeAreaView style={styles.pickerContainer} edges={['top', 'bottom']}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowDateModal(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Set Date & Time</Text>
            <TouchableOpacity onPress={confirmDate}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.pickerContent}>
            <Text style={styles.pickerSection}>Date</Text>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m, idx) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, tempMonth === idx && styles.pickerItemSelected]}
                      onPress={() => {
                        setTempMonth(idx);
                        const maxDays = getDaysInMonth(idx, tempYear);
                        if (tempDay > maxDays) setTempDay(maxDays);
                      }}
                    >
                      <Text style={[styles.pickerItemText, tempMonth === idx && styles.pickerItemTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.pickerItem, tempDay === d && styles.pickerItemSelected]}
                      onPress={() => setTempDay(d)}
                    >
                      <Text style={[styles.pickerItemText, tempDay === d && styles.pickerItemTextSelected]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.pickerItem, tempYear === y && styles.pickerItemSelected]}
                      onPress={() => setTempYear(y)}
                    >
                      <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextSelected]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.pickerSection}>Time</Text>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Hour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, tempHour === h && styles.pickerItemSelected]}
                      onPress={() => setTempHour(h)}
                    >
                      <Text style={[styles.pickerItemText, tempHour === h && styles.pickerItemTextSelected]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Minute</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, tempMinute === m && styles.pickerItemSelected]}
                      onPress={() => setTempMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, tempMinute === m && styles.pickerItemTextSelected]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.s20,
    paddingBottom: Spacing.s48,
  },
  formGroup: {
    marginBottom: Spacing.s20,
  },
  fieldLabel: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    marginBottom: Spacing.s8,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    backgroundColor: Colors.white,
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  dateButtonText: {
    ...Typography.callout,
    color: Colors.neutral[800],
  },
  mapHint: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginBottom: Spacing.s8,
  },
  map: {
    height: 220,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  coordsText: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: Spacing.s4,
  },
  saveButton: {
    marginTop: Spacing.s8,
  },
  // Picker Modal
  pickerContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  pickerTitle: {
    ...Typography.headline,
    color: Colors.neutral[900],
  },
  pickerCancel: {
    ...Typography.body,
    color: Colors.neutral[500],
  },
  pickerDone: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  pickerContent: {
    padding: Spacing.s20,
    paddingBottom: Spacing.s48,
  },
  pickerSection: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s12,
    marginTop: Spacing.s8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColumnLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.s4,
  },
  pickerScroll: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
  },
  pickerItem: {
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: Colors.brand.light,
  },
  pickerItemText: {
    ...Typography.body,
    color: Colors.neutral[700],
  },
  pickerItemTextSelected: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
});
