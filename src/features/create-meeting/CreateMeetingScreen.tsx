import { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinButton } from '../../design-system/components/PinButton';
import { PinTextField } from '../../design-system/components/PinTextField';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { DatePickerModal } from './components/DatePickerModal';
import { useCreateMeeting } from './hooks/useCreateMeeting';

export default function CreateMeetingScreen() {
  const {
    title,
    setTitle,
    description,
    setDescription,
    date,
    coordinates,
    showDateModal,
    setShowDateModal,
    tempDay,
    setTempDay,
    tempMonth,
    setTempMonth,
    tempYear,
    setTempYear,
    tempHour,
    setTempHour,
    tempMinute,
    setTempMinute,
    handleMapPress,
    openDateModal,
    confirmDate,
    getDaysInMonth,
    handleSave,
  } = useCreateMeeting();

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

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Location</Text>
          <Text style={styles.mapHint}>Tap on the map to set the meeting point</Text>
          <MapView
            style={styles.map}
            onPress={(feature: any) =>
              handleMapPress({
                geometry: {
                  coordinates: [
                    feature.geometry.coordinates[0],
                    feature.geometry.coordinates[1],
                  ] as [number, number],
                },
              })
            }
          >
            <Camera
              centerCoordinate={[coordinates.longitude, coordinates.latitude]}
              zoomLevel={13}
              animationDuration={0}
            />
            <PointAnnotation
              id="meeting-location"
              coordinate={[coordinates.longitude, coordinates.latitude]}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: Colors.brand.primary,
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            </PointAnnotation>
          </MapView>
          <Text style={styles.coordsText}>
            {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
          </Text>
        </View>

        <View style={styles.saveButton}>
          <PinButton title="Create Meeting" onPress={handleSave} fullWidth size="lg" />
        </View>
      </ScrollView>

      <DatePickerModal
        visible={showDateModal}
        tempDay={tempDay}
        tempMonth={tempMonth}
        tempYear={tempYear}
        tempHour={tempHour}
        tempMinute={tempMinute}
        getDaysInMonth={getDaysInMonth}
        onChangeDay={setTempDay}
        onChangeMonth={setTempMonth}
        onChangeYear={setTempYear}
        onChangeHour={setTempHour}
        onChangeMinute={setTempMinute}
        onConfirm={confirmDate}
        onClose={() => setShowDateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scrollView: { flex: 1 },
  content: { padding: Spacing.s20, paddingBottom: Spacing.s48 },
  formGroup: { marginBottom: Spacing.s20 },
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
  dateButtonIcon: { fontSize: 20 },
  dateButtonText: { ...Typography.callout, color: Colors.neutral[800] },
  mapHint: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginBottom: Spacing.s8,
  },
  map: { height: 220, borderRadius: Radii.md, overflow: 'hidden' },
  coordsText: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: Spacing.s4,
  },
  saveButton: { marginTop: Spacing.s8 },
});
