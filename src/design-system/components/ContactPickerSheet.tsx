import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PhoneContact } from '../../services/contacts';
import { Colors, Radii, Spacing, Typography } from '../tokens';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface Props {
  contacts: PhoneContact[];
  loading: boolean;
  // Names already on the memory. Shown ticked and inert — removing one belongs to the chip it
  // already has, not to this list.
  alreadyAdded: string[];
  onDone: (names: string[]) => void;
  onCancel: () => void;
}

interface RowProps {
  contact: PhoneContact;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

const ContactRow = React.memo(function ContactRow({
  contact,
  selected,
  disabled,
  onToggle,
}: RowProps) {
  const handlePress = useCallback(() => onToggle(contact.id), [onToggle, contact.id]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={selected ? CHECKED : UNCHECKED}
      accessibilityLabel={contact.name}
    >
      <Text style={disabled ? styles.rowNameDisabled : styles.rowName} numberOfLines={1}>
        {contact.name}
      </Text>
      {(selected || disabled) && (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={disabled ? Colors.neutral[300] : Colors.brand.primary}
        />
      )}
    </TouchableOpacity>
  );
});

const CHECKED = { checked: true };
const UNCHECKED = { checked: false };

// Picking who you were with, from the device address book. Only names ever reach this — see
// services/contacts.ts — so there is nothing else to show in a row.
//
// An absolutely-positioned overlay, deliberately not a Modal. On the map the companion field
// lives inside the quick-add sheet, which is already a native Modal, and a second one on top
// of it leaves iOS's touch-responder chain broken after both dismiss — the map underneath
// stops responding entirely. It fills its nearest positioned ancestor instead, so whoever
// renders it must give it a full-screen box.
//
// Mounted only while open, so the search box and the ticks start clean on every visit.
export function ContactPickerSheet({ contacts, loading, alreadyAdded, onDone, onCancel }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addedKeys = useMemo(
    () => new Set(alreadyAdded.map((name) => name.toLocaleLowerCase())),
    [alreadyAdded],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) => contact.name.toLocaleLowerCase().includes(needle));
  }, [contacts, query]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((each) => each !== id) : [...prev, id],
    );
  }, []);

  const handleDone = useCallback(() => {
    const byId = new Map(contacts.map((contact) => [contact.id, contact.name]));
    onDone(selectedIds.map((id) => byId.get(id)).filter((name): name is string => Boolean(name)));
  }, [contacts, selectedIds, onDone]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhoneContact>) => (
      <ContactRow
        contact={item}
        selected={selectedIds.includes(item.id)}
        disabled={addedKeys.has(item.name.toLocaleLowerCase())}
        onToggle={handleToggle}
      />
    ),
    [selectedIds, addedKeys, handleToggle],
  );

  const keyExtractor = useCallback((item: PhoneContact) => item.id, []);

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={HIT_SLOP_8}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Who was with you?</Text>
        <TouchableOpacity onPress={handleDone} hitSlop={HIT_SLOP_8} disabled={!selectedIds.length}>
          <Text style={selectedIds.length ? styles.done : styles.doneDisabled}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.text.secondary} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search contacts"
          placeholderTextColor={Colors.text.secondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={Colors.brand.primary} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {contacts.length === 0
                ? 'No named contacts on this device.'
                : 'No contact matches that.'}
            </Text>
          }
        />
      )}
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
  cancel: { ...Typography.body, color: Colors.text.secondary },
  done: { ...Typography.headline, color: Colors.brand.primary },
  doneDisabled: { ...Typography.headline, color: Colors.neutral[300] },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    margin: Spacing.s16,
    paddingHorizontal: Spacing.s12,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.neutral[50],
  },
  search: { flex: 1, ...Typography.body, color: Colors.text.primary },
  loading: { marginTop: Spacing.s32 },
  listContent: { paddingBottom: Spacing.s32 },
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
    marginTop: Spacing.s32,
    paddingHorizontal: Spacing.s24,
  },
});
