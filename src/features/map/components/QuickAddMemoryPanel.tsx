import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CompanionInput } from '../../../design-system/components/CompanionInput';
import { ContactPickerSheet } from '../../../design-system/components/ContactPickerSheet';
import { MoodPicker } from '../../../design-system/components/MoodPicker';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { MemoryMood, MOOD_CONFIG } from '../../../models/types';
import { useContactPicker } from '../../../hooks/useContactPicker';
import { pickPhotos } from '../../../shared/pickPhotos';
import { HIT_SLOP_8 } from '../constants';
import { QuickAddMemoryDraft } from '../hooks/useMapScreen';

const MAX_MEMORY_PHOTOS = 5;

interface Props {
  // The draft being edited, or null when composing a new one.
  draft: QuickAddMemoryDraft | null;
  onDone: (draft: QuickAddMemoryDraft) => void;
  onRemove: () => void;
  onCancel: () => void;
}

// The memory composer for a place that does not exist yet. Deliberately NOT a Modal: the
// quick-add sheet is already one, and the file it lives in documents why a second native
// Modal on top of it breaks iOS's touch-responder chain and freezes the map underneath. It is
// also what keeps "you end up back on the same screen" true — nothing unmounts, so the
// half-filled place form is exactly where it was when this closes.
// Mounted only while open, so `draft` seeds the fields once and reopening always re-seeds
// from whatever is currently attached to the place.
export function QuickAddMemoryPanel({ draft, onDone, onRemove, onCancel }: Props) {
  const [text, setText] = useState(draft?.text ?? '');
  const [photoUris, setPhotoUris] = useState<string[]>(draft?.photoUris ?? []);
  const [mood, setMood] = useState<MemoryMood | undefined>(draft?.mood);
  const [companions, setCompanions] = useState<string[]>(draft?.companions ?? []);

  const handlePickPhotos = useCallback(async () => {
    const picked = await pickPhotos(MAX_MEMORY_PHOTOS - photoUris.length);
    if (picked.length === 0) return;
    setPhotoUris((prev) => [...prev, ...picked].slice(0, MAX_MEMORY_PHOTOS));
  }, [photoUris.length]);

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  const handleRemoveCompanion = useCallback((name: string) => {
    setCompanions((prev) => prev.filter((c) => c !== name));
  }, []);

  const contactPicker = useContactPicker();

  // The only way a name reaches this memory now — typed or picked, both land here. Guards
  // against a duplicate chip: the sheet's own dedupe only covers names already picked, not one
  // typed by hand that happens to match a contact already added.
  const handleContactAdded = useCallback((name: string) => {
    setCompanions((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  const handleSelectMood = useCallback((selected: MemoryMood) => {
    setMood((prev) => (prev === selected ? undefined : selected));
  }, []);

  const handleDone = useCallback(() => {
    onDone({ text: text.trim(), photoUris, mood, companions });
  }, [onDone, text, photoUris, mood, companions]);

  // An empty memory is not worth attaching to the place — Done stays disabled until there is
  // something in it.
  const isEmpty = text.trim() === '' && photoUris.length === 0 && !mood && companions.length === 0;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={HIT_SLOP_8}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Memory</Text>
        <TouchableOpacity onPress={handleDone} hitSlop={HIT_SLOP_8} disabled={isEmpty}>
          <Text style={isEmpty ? styles.doneDisabled : styles.done}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // The sheet this sits inside deliberately has no KeyboardAvoidingView — one broke the
        // keyboard here before, and the note field is the last thing above the fold. This is
        // the part of it that is safe: the scroll view widens its own inset by the keyboard,
        // so the companion and photo rows can still be scrolled into view while typing.
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.fieldLabel}>Note</Text>
        <TextInput
          style={styles.noteInput}
          value={text}
          onChangeText={setText}
          placeholder="What happened here?"
          placeholderTextColor={Colors.neutral[400]}
          multiline
        />

        <Text style={styles.fieldLabel}>How did it feel?</Text>
        <MoodPicker selected={mood} onSelect={handleSelectMood} />

        <Text style={styles.fieldLabel}>Who was with you?</Text>
        <CompanionInput
          companions={companions}
          onRemove={handleRemoveCompanion}
          onOpenPicker={contactPicker.open}
        />

        <Text style={styles.fieldLabel}>Photos</Text>
        <View style={styles.photoRow}>
          {photoUris.map((uri) => (
            <MemoryPhoto key={uri} uri={uri} onRemove={handleRemovePhoto} />
          ))}
          {photoUris.length < MAX_MEMORY_PHOTOS && (
            <TouchableOpacity style={styles.addPhoto} onPress={handlePickPhotos}>
              <Ionicons name="camera-outline" size={22} color={Colors.brand.primary} />
            </TouchableOpacity>
          )}
        </View>

        {draft && (
          <TouchableOpacity style={styles.removeMemory} onPress={onRemove}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.removeMemoryText}>Remove memory</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Outside the ScrollView, so it fills the panel rather than scrolling with the form.
          Not a Modal: this panel already lives inside the quick-add sheet's Modal. */}
      {contactPicker.visible && (
        <ContactPickerSheet
          access={contactPicker.access}
          contacts={contactPicker.contacts}
          loading={contactPicker.loading}
          alreadyAdded={companions}
          onAdd={handleContactAdded}
          onClose={contactPicker.close}
        />
      )}
    </View>
  );
}

const MemoryPhoto = React.memo(function MemoryPhoto({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: (uri: string) => void;
}) {
  const handleRemove = useCallback(() => onRemove(uri), [onRemove, uri]);

  return (
    <View style={styles.photoWrap}>
      <Image source={{ uri }} style={styles.photo} contentFit="cover" />
      <TouchableOpacity style={styles.photoRemove} onPress={handleRemove} hitSlop={HIT_SLOP_8}>
        <Ionicons name="close" size={12} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
});

// How many of the memory's photos the summary shows before falling back to a count.
const SUMMARY_PREVIEW_PHOTOS = 3;

// Summary of a composed memory, shown on the place form in place of the "add" button.
export function QuickAddMemorySummary({
  draft,
  onEdit,
}: {
  draft: QuickAddMemoryDraft;
  onEdit: () => void;
}) {
  const parts: string[] = [];
  if (draft.mood) parts.push(`${MOOD_CONFIG[draft.mood].emoji} ${MOOD_CONFIG[draft.mood].label}`);
  if (draft.companions.length > 0) parts.push(`with ${draft.companions.join(', ')}`);

  const previewUris = draft.photoUris.slice(0, SUMMARY_PREVIEW_PHOTOS);
  const overflow = draft.photoUris.length - previewUris.length;

  return (
    <TouchableOpacity style={styles.summary} onPress={onEdit} activeOpacity={0.8}>
      {/* The photos themselves rather than a count of them: the form already shows the
          place's own photos as thumbnails, and "2 photos" gives the user no way to tell
          which two they picked. */}
      {previewUris.length > 0 && (
        <View style={styles.summaryPhotoRow}>
          {previewUris.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.summaryPhoto} contentFit="cover" />
          ))}
          {overflow > 0 && (
            <View style={styles.summaryPhotoMore}>
              <Text style={styles.summaryPhotoMoreText}>+{overflow}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.summaryTextCol}>
        <Text style={styles.summaryTitle} numberOfLines={2}>
          {draft.text || 'Memory attached'}
        </Text>
        {parts.length > 0 && (
          <Text style={styles.summaryMeta} numberOfLines={1}>
            {parts.join(' · ')}
          </Text>
        )}
      </View>
      <Ionicons name="create-outline" size={20} color={Colors.brand.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: { ...Typography.headline, color: Colors.text.primary },
  cancel: { ...Typography.body, color: Colors.text.secondary },
  done: { ...Typography.headline, color: Colors.brand.primary },
  doneDisabled: { ...Typography.headline, color: Colors.neutral[300] },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.s16, paddingBottom: Spacing.s32, gap: Spacing.s8 },
  fieldLabel: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    marginTop: Spacing.s8,
  },
  noteInput: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral[50],
    borderRadius: Radii.md,
    padding: Spacing.s12,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s8 },
  photoWrap: { width: 72, height: 72 },
  photo: { width: 72, height: 72, borderRadius: Radii.md },
  photoRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMemory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    marginTop: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  removeMemoryText: { ...Typography.body, color: Colors.error },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    backgroundColor: Colors.brand.light,
    borderRadius: Radii.md,
    padding: Spacing.s12,
  },
  summaryPhotoRow: { flexDirection: 'row', gap: Spacing.s4 },
  summaryPhoto: { width: 44, height: 44, borderRadius: Radii.sm },
  summaryPhotoMore: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPhotoMoreText: { ...Typography.footnote, color: Colors.white },
  summaryTextCol: { flex: 1 },
  summaryTitle: { ...Typography.body, color: Colors.text.primary },
  summaryMeta: { ...Typography.footnote, color: Colors.neutral[600], marginTop: Spacing.s2 },
});
