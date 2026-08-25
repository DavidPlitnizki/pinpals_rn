import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalogClock } from '../../design-system/components/AnalogClock';
import { CompanionInput } from '../../design-system/components/CompanionInput';
import { MoodPicker } from '../../design-system/components/MoodPicker';
import { PinButton } from '../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { useCreateMemory } from './hooks/useCreateMemory';

const STEP_TITLES = ['Photo', 'Mood', 'Companions', 'Note', 'Date & time'];

// Created once at module level — an inline element would be a new object on every render.
// The chevron is small; this brings its touch target up to the 44pt minimum.
const BACK_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const SAVE_ICON = <Ionicons name="checkmark" size={20} color={Colors.white} />;
const NEXT_ICON = <Ionicons name="arrow-forward" size={20} color={Colors.white} />;

export default function CreateMemoryScreen() {
  const {
    place,
    isEditing,
    step,
    totalSteps,
    photoUris,
    mood,
    companions,
    text,
    date,
    canGoNext,
    isLastStep,
    nextStep,
    prevStep,
    pickPhotos,
    removePhoto,
    setMood,
    addCompanion,
    removeCompanion,
    setText,
    setDate,
    handleSave,
  } = useCreateMemory();

  if (!place) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.errorText}>Place not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {/* The same chevron on every step, including the first, where it closes the screen:
            one control that always means "go back one" reads faster than a label that
            changes between Cancel and Back. */}
        <TouchableOpacity onPress={prevStep} style={styles.backBtn} hitSlop={BACK_HIT_SLOP}>
          <Ionicons name="chevron-back" size={28} color={Colors.brand.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{place.name}</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <PhotoStep photoUris={photoUris} onPick={pickPhotos} onRemove={removePhoto} />
        )}
        {step === 1 && <MoodStep mood={mood} onSelect={setMood} />}
        {step === 2 && (
          <CompanionStep companions={companions} onAdd={addCompanion} onRemove={removeCompanion} />
        )}
        {step === 3 && <NoteStep text={text} onChangeText={setText} />}
        {step === 4 && <DateStep date={date} onChangeDate={setDate} />}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.footer}>
        {isLastStep ? (
          <PinButton
            title={isEditing ? 'Save Changes' : 'Save Memory'}
            onPress={handleSave}
            fullWidth
            leftIcon={SAVE_ICON}
          />
        ) : (
          <PinButton
            title="Next"
            onPress={nextStep}
            disabled={!canGoNext}
            fullWidth
            rightIcon={NEXT_ICON}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* Step components */

const PhotoThumb = React.memo(function PhotoThumb({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: (uri: string) => void;
}) {
  const handleRemove = useCallback(() => onRemove(uri), [onRemove, uri]);
  return (
    <View style={styles.photoItem}>
      <Image source={{ uri }} style={styles.photoThumb} />
      <TouchableOpacity style={styles.photoRemove} onPress={handleRemove}>
        <Text style={styles.photoRemoveText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

function PhotoStep({
  photoUris,
  onPick,
  onRemove,
}: {
  photoUris: string[];
  onPick: () => void;
  onRemove: (uri: string) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Add up to 5 photos to this memory</Text>
      <View style={styles.photoGrid}>
        {photoUris.map((uri) => (
          <PhotoThumb key={uri} uri={uri} onRemove={onRemove} />
        ))}
        {photoUris.length < 5 && (
          <TouchableOpacity style={styles.photoAdd} onPress={onPick}>
            <Text style={styles.photoAddIcon}>📷</Text>
            <Text style={styles.photoAddText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MoodStep({
  mood,
  onSelect,
}: {
  mood: ReturnType<typeof useCreateMemory>['mood'];
  onSelect: ReturnType<typeof useCreateMemory>['setMood'];
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>What was the mood of this moment?</Text>
      <MoodPicker selected={mood} onSelect={onSelect} />
    </View>
  );
}

function CompanionStep({
  companions,
  onAdd,
  onRemove,
}: {
  companions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Who were you with?</Text>
      <CompanionInput
        companions={companions}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Friend's name..."
      />
    </View>
  );
}

function NoteStep({ text, onChangeText }: { text: string; onChangeText: (t: string) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Add a note (optional)</Text>
      <TextInput
        style={styles.noteInput}
        value={text}
        onChangeText={onChangeText}
        placeholder="What do you remember..."
        placeholderTextColor={Colors.text.secondary}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

function DateStep({ date, onChangeDate }: { date: Date; onChangeDate: (d: Date) => void }) {
  // iOS shows both pickers inline; Android has no inline mode, so each one is opened as the
  // platform's own dialog (the time dialog there is the native analog clock).
  const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(null);

  const handleShowDate = useCallback(() => setAndroidPicker('date'), []);
  const handleShowTime = useCallback(() => setAndroidPicker('time'), []);
  const handleNow = useCallback(() => onChangeDate(new Date()), [onChangeDate]);

  const handleChangeDate = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      setAndroidPicker(null);
      if (event.type === 'dismissed' || !selected) return;
      // The date wheel carries its own (untouched) time and the time wheel its own date —
      // merge so changing one never silently resets the other.
      const next = new Date(date);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onChangeDate(next);
    },
    [date, onChangeDate],
  );

  const handleChangeTime = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      setAndroidPicker(null);
      if (event.type === 'dismissed' || !selected) return;
      const next = new Date(date);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChangeDate(next);
    },
    [date, onChangeDate],
  );

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayMonth = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  const year = date.getFullYear();

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>When was this?</Text>

      <View style={styles.dateHeadline}>
        <Text style={styles.dateWeekday}>{weekday}</Text>
        <Text style={styles.dateBig}>{dayMonth}</Text>
        <Text style={styles.dateYear}>{year}</Text>
      </View>

      {Platform.OS === 'ios' ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            locale="en-US"
            onChange={handleChangeDate}
            accentColor={Colors.brand.primary}
            themeVariant="light"
            style={styles.iosDatePicker}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.pickerButton} onPress={handleShowDate}>
          <Text style={styles.pickerButtonText}>Change date</Text>
        </TouchableOpacity>
      )}

      <View style={styles.clockRow}>
        <AnalogClock date={date} />
        <View style={styles.clockSide}>
          <Text style={styles.timeText}>
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={date}
              mode="time"
              display="compact"
              locale="en-US"
              onChange={handleChangeTime}
              accentColor={Colors.brand.primary}
              themeVariant="light"
            />
          ) : (
            <TouchableOpacity style={styles.pickerButton} onPress={handleShowTime}>
              <Text style={styles.pickerButtonText}>Change time</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNow} style={styles.nowButton}>
            <Text style={styles.nowButtonText}>Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {androidPicker === 'date' && (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleChangeDate} />
      )}
      {androidPicker === 'time' && (
        <DateTimePicker value={date} mode="time" display="clock" onChange={handleChangeTime} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  // Matched width on both sides so the place name stays optically centred in the header.
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  backBtnPlaceholder: {
    width: 32,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.s8,
    paddingVertical: Spacing.s8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[200],
  },
  progressDotActive: {
    backgroundColor: Colors.brand.primary,
  },
  stepTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.s16,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s32,
  },
  stepContent: {
    gap: Spacing.s16,
  },
  stepHint: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.s48,
  },

  // Photo step
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  photoItem: {
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: Radii.md,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.s4,
  },
  photoAddIcon: {
    fontSize: 24,
  },
  photoAddText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },

  // Note step
  noteInput: {
    height: 150,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
    padding: Spacing.s12,
    ...Typography.body,
    color: Colors.text.primary,
  },

  // Date & time step
  dateHeadline: {
    alignItems: 'center',
    marginBottom: Spacing.s16,
  },
  dateWeekday: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateBig: {
    ...Typography.title1,
    color: Colors.neutral[900],
  },
  dateYear: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
  },
  pickerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.s4,
    paddingVertical: Spacing.s4,
  },
  iosDatePicker: {
    width: '100%',
  },
  pickerButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  pickerButtonText: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    fontWeight: '600',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s20,
    marginTop: Spacing.s20,
  },
  clockSide: {
    alignItems: 'center',
    gap: Spacing.s8,
  },
  timeText: {
    ...Typography.title2,
    color: Colors.neutral[900],
  },
  nowButton: {
    paddingVertical: Spacing.s4,
    paddingHorizontal: Spacing.s12,
  },
  nowButtonText: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
});
