import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompanionInput } from '../../design-system/components/CompanionInput';
import { MoodPicker } from '../../design-system/components/MoodPicker';
import { PinButton } from '../../design-system/components/PinButton';
import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { useCreateMemory } from './hooks/useCreateMemory';

const STEP_TITLES = ['Photo', 'Mood', 'Companions', 'Note', 'Date'];

export default function CreateMemoryScreen() {
  const {
    place,
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
        <Text style={styles.errorText}>Место не найдено</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep}>
          <Text style={styles.backBtn}>{step === 0 ? 'Отмена' : 'Назад'}</Text>
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
          <PinButton title="Сохранить воспоминание" onPress={handleSave} fullWidth />
        ) : (
          <PinButton title="Далее" onPress={nextStep} disabled={!canGoNext} fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

/* Step components */

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
      <Text style={styles.stepHint}>Добавь до 5 фото к этому воспоминанию</Text>
      <View style={styles.photoGrid}>
        {photoUris.map((uri) => (
          <View key={uri} style={styles.photoItem}>
            <Image source={{ uri }} style={styles.photoThumb} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => onRemove(uri)}>
              <Text style={styles.photoRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photoUris.length < 5 && (
          <TouchableOpacity style={styles.photoAdd} onPress={onPick}>
            <Text style={styles.photoAddIcon}>📷</Text>
            <Text style={styles.photoAddText}>Добавить</Text>
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
      <Text style={styles.stepHint}>Какое настроение у этого момента?</Text>
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
      <Text style={styles.stepHint}>С кем ты был?</Text>
      <CompanionInput
        companions={companions}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Имя друга..."
      />
    </View>
  );
}

function NoteStep({ text, onChangeText }: { text: string; onChangeText: (t: string) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Добавь заметку (необязательно)</Text>
      <TextInput
        style={styles.noteInput}
        value={text}
        onChangeText={onChangeText}
        placeholder="Что запомнилось..."
        placeholderTextColor={Colors.text.secondary}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

function DateStep({ date, onChangeDate }: { date: Date; onChangeDate: (d: Date) => void }) {
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepHint}>Когда это было?</Text>
      <View style={styles.dateOptions}>
        <TouchableOpacity
          style={[styles.dateOption, isToday && styles.dateOptionActive]}
          onPress={() => onChangeDate(new Date())}
        >
          <Text style={[styles.dateOptionText, isToday && styles.dateOptionTextActive]}>
            Сегодня
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateOption, !isToday && styles.dateOptionActive]}
          onPress={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            onChangeDate(yesterday);
          }}
        >
          <Text style={[styles.dateOptionText, !isToday && styles.dateOptionTextActive]}>
            Вчера
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.dateDisplay}>
        {date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>
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
  backBtn: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  backBtnPlaceholder: {
    width: 60,
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

  // Date step
  dateOptions: {
    flexDirection: 'row',
    gap: Spacing.s12,
    justifyContent: 'center',
  },
  dateOption: {
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s12,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  dateOptionActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  dateOptionText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dateOptionTextActive: {
    color: Colors.white,
  },
  dateDisplay: {
    ...Typography.title3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
