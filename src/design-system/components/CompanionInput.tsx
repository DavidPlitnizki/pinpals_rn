import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  getContactsAccess,
  loadContactNames,
  PhoneContact,
  requestContactsAccess,
} from '../../services/contacts';
import { Colors, Radii, Spacing, Typography } from '../tokens';
import { ContactPickerSheet } from './ContactPickerSheet';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface CompanionInputProps {
  companions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  placeholder?: string;
}

// Shown when the address book is refused. The field it sits above still works exactly as it
// did before contacts existed, so this explains what was lost rather than blocking anything.
const DENIED_TITLE = 'Contacts are off';
const DENIED_BODY =
  'Pinpals can fill in who you were with from your address book. It only ever reads names — ' +
  'never numbers or emails. You can still type names in yourself.';

interface CompanionChipProps {
  name: string;
  onRemove: (name: string) => void;
}

const CompanionChip = React.memo(function CompanionChip({ name, onRemove }: CompanionChipProps) {
  const handleRemove = useCallback(() => onRemove(name), [onRemove, name]);

  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{name}</Text>
      <TouchableOpacity onPress={handleRemove} hitSlop={HIT_SLOP_8}>
        <Text style={styles.chipRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

export function CompanionInput({
  companions,
  onAdd,
  onRemove,
  placeholder = 'Name...',
}: CompanionInputProps) {
  const [text, setText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Asks the first time and opens the picker; explains once refused, and points at Settings
  // when the system will not ask again. Refusal costs nothing — the text field below is the
  // same one that was here before, and stays the whole feature for anyone who says no.
  const handleOpenPicker = useCallback(async () => {
    // Only 'denied' is worth a prompt. 'blocked' means the system has stopped asking, and
    // requesting again shows the user nothing while quietly answering "no" — which would put
    // the wrong alert on screen, the one without a way to fix it.
    const current = await getContactsAccess();
    const access = current === 'denied' ? await requestContactsAccess() : current;

    if (access === 'blocked') {
      Alert.alert(DENIED_TITLE, DENIED_BODY, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    if (access !== 'granted') {
      Alert.alert(DENIED_TITLE, DENIED_BODY);
      return;
    }

    setPickerOpen(true);
    setLoadingContacts(true);
    const loaded = await loadContactNames();
    setContacts(loaded);
    setLoadingContacts(false);
  }, []);

  const handlePickerPress = useCallback(() => {
    void handleOpenPicker();
  }, [handleOpenPicker]);

  const handlePickerCancel = useCallback(() => setPickerOpen(false), []);

  const handlePickerDone = useCallback(
    (names: string[]) => {
      setPickerOpen(false);
      // The picker only offers names not already on the memory, but a name typed by hand can
      // collide with one from the address book — the last guard against a duplicate chip.
      for (const name of names) {
        if (!companions.includes(name)) onAdd(name);
      }
    },
    [companions, onAdd],
  );

  const handleSubmit = useCallback(() => {
    const name = text.trim();
    if (name && !companions.includes(name)) {
      onAdd(name);
      setText('');
    }
  }, [text, companions, onAdd]);

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {companions.map((name) => (
          <CompanionChip key={name} name={name} onRemove={onRemove} />
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.secondary}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        {text.trim() ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleSubmit}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.contactsBtn}
            onPress={handlePickerPress}
            accessibilityRole="button"
            accessibilityLabel="Pick from contacts"
          >
            <Ionicons name="person-add-outline" size={20} color={Colors.brand.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ContactPickerSheet
        visible={pickerOpen}
        contacts={contacts}
        loading={loadingContacts}
        alreadyAdded={companions}
        onDone={handlePickerDone}
        onCancel={handlePickerCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.light,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s12,
    height: 32,
    gap: Spacing.s4,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  chipRemove: {
    ...Typography.caption,
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    ...Typography.body,
    color: Colors.text.primary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  // Takes the add button's place while the field is empty, so the row never grows a third
  // control and typing a name still leads to the same "+" it always did.
  contactsBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
