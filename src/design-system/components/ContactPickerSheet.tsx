import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContactsAccess, PhoneContact } from '../../services/contacts';
import { Colors, Radii, Spacing, Typography } from '../tokens';
import { CircleCloseButton } from './CircleCloseButton';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

const handleOpenSettings = () => void Linking.openSettings();

// paddingVertical (Spacing.s12) * 2 + the taller of the row's contents: the name text's line
// height (Typography.body, 22) and the checkmark icon (size 22) — kept in sync with `styles.row`
// and `styles.rowName` below, since FlatList's getItemLayout has to match the real row height.
const ROW_HEIGHT = Spacing.s12 * 2 + 22;

interface Props {
  // Null while the picker is still resolving what it is allowed to read.
  access: ContactsAccess | null;
  contacts: PhoneContact[];
  loading: boolean;
  // Names already on the memory. Shown ticked and inert — removing one belongs to the chip it
  // already has, not to this list.
  alreadyAdded: string[];
  // Fires once per name, immediately — from tapping a contact row or pressing Add on typed
  // text. There is no batch "Done": each add lands as it happens, so the sheet can be closed
  // at any point without losing whatever was already added.
  onAdd: (name: string) => void;
  onClose: () => void;
}

interface RowProps {
  contact: PhoneContact;
  disabled: boolean;
  onPress: (name: string) => void;
}

const ContactRow = React.memo(function ContactRow({ contact, disabled, onPress }: RowProps) {
  const handlePress = useCallback(() => onPress(contact.name), [onPress, contact.name]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={disabled ? DISABLED : undefined}
      accessibilityLabel={contact.name}
    >
      <Text style={disabled ? styles.rowNameDisabled : styles.rowName} numberOfLines={1}>
        {contact.name}
      </Text>
      {disabled && <Ionicons name="checkmark-circle" size={22} color={Colors.neutral[300]} />}
    </TouchableOpacity>
  );
});

const DISABLED = { disabled: true };

// One field does both jobs: search the address book, or type a name it does not have. As you
// type, any matching contact appears below and a tap on it adds that name straight away. What
// you typed also always stays available to add as-is — pressing Return/Done on the keyboard
// submits it, so there is nothing else on screen that could be mistaken for a second control.
//
// An absolutely-positioned overlay, deliberately not a Modal. On the map this sits inside the
// quick-add sheet, which is already a native Modal, and a second one on top of it leaves iOS's
// touch-responder chain broken after both dismiss — the map underneath stops responding
// entirely. It fills its nearest positioned ancestor instead, so whoever renders it must give
// it a full-screen box.
//
// Mounted only while open, so the field and the list start clean on every visit.
export function ContactPickerSheet({
  access,
  contacts,
  loading,
  alreadyAdded,
  onAdd,
  onClose,
}: Props) {
  const [text, setText] = useState('');

  const addedKeys = useMemo(
    () => new Set(alreadyAdded.map((name) => name.toLocaleLowerCase())),
    [alreadyAdded],
  );

  // Lowercased once per contacts load rather than on every keystroke — an address book can run
  // into the thousands, and re-lowercasing every name on every character typed adds up.
  const searchable = useMemo(
    () => contacts.map((contact) => ({ contact, nameLower: contact.name.toLocaleLowerCase() })),
    [contacts],
  );

  const filtered = useMemo(() => {
    const needle = text.trim().toLocaleLowerCase();
    if (!needle) return contacts;
    return searchable
      .filter((entry) => entry.nameLower.includes(needle))
      .map((entry) => entry.contact);
  }, [searchable, contacts, text]);

  const trimmed = text.trim();

  const handleAddTyped = useCallback(() => {
    // Guards an empty Return/Done press — a name already on the memory is still worth
    // submitting (it's a harmless no-op for the caller to dedupe, not this sheet's job to guess).
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  }, [onAdd, trimmed]);

  const handlePickRow = useCallback(
    (name: string) => {
      onAdd(name);
      setText('');
    },
    [onAdd],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhoneContact>) => (
      <ContactRow
        contact={item}
        disabled={addedKeys.has(item.name.toLocaleLowerCase())}
        onPress={handlePickRow}
      />
    ),
    [addedKeys, handlePickRow],
  );

  const keyExtractor = useCallback((item: PhoneContact) => item.id, []);

  // Rows are a fixed height (paddingVertical * 2 + the taller of the name text's line height
  // and the checkmark icon, both 22), so FlatList doesn't need to measure them itself.
  const getItemLayout = useCallback(
    (_data: ArrayLike<PhoneContact> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  // Only 'granted' has a list to show. Everything else — still resolving, refused, or the
  // native module missing from this build — leaves the field as a plain manual-entry box.
  const resolving = access === null;
  const showList = access === 'granted';

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Who was with you?</Text>
        <CircleCloseButton onPress={onClose} />
      </View>

      <View style={styles.fieldRow}>
        <Ionicons name="search" size={18} color={Colors.text.secondary} />
        <TextInput
          style={styles.field}
          value={text}
          onChangeText={setText}
          placeholder="Search or type a name"
          placeholderTextColor={Colors.text.secondary}
          accessibilityLabel="Search or type a companion's name"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAddTyped}
          // Mounted only while the sheet is open, so this fires once per opening — the field
          // is the whole reason the sheet exists, so it starts ready to type into.
          autoFocus
        />
      </View>

      {access === 'blocked' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Contacts are off. Turn them on in Settings to pick from your address book — typing still
            works.
          </Text>
          <TouchableOpacity onPress={handleOpenSettings} hitSlop={HIT_SLOP_8}>
            <Text style={styles.hintLink}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {access === 'denied' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Contacts are off, so typing is how this fills in.</Text>
        </View>
      )}

      {resolving && <ActivityIndicator style={styles.loading} color={Colors.brand.primary} />}

      {showList &&
        (loading ? (
          <ActivityIndicator style={styles.loading} color={Colors.brand.primary} />
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              contacts.length > 0 ? (
                <Text style={styles.empty}>No contact matches that — Add uses what you typed.</Text>
              ) : (
                <Text style={styles.empty}>No named contacts on this device.</Text>
              )
            }
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
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
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    margin: Spacing.s16,
    paddingHorizontal: Spacing.s12,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.neutral[50],
  },
  field: { flex: 1, ...Typography.body, color: Colors.text.primary },
  hint: {
    paddingHorizontal: Spacing.s16,
    marginBottom: Spacing.s12,
    gap: Spacing.s4,
  },
  hintText: { ...Typography.footnote, color: Colors.text.secondary },
  hintLink: { ...Typography.footnote, color: Colors.brand.primary, fontWeight: '600' },
  loading: { marginTop: Spacing.s32 },
  listContent: { paddingBottom: Spacing.s16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  rowName: { ...Typography.body, color: Colors.text.primary, flex: 1 },
  rowNameDisabled: { ...Typography.body, color: Colors.neutral[400], flex: 1 },
  empty: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.s16,
    paddingHorizontal: Spacing.s24,
  },
});
