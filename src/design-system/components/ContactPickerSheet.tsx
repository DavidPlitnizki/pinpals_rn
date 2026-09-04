import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhoneContact } from '../../services/contacts';
import { Colors, Radii, Spacing, Typography } from '../tokens';

const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };

interface Props {
  visible: boolean;
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
export function ContactPickerSheet({
  visible,
  contacts,
  loading,
  alreadyAdded,
  onDone,
  onCancel,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset on each open rather than in an effect: the sheet stays mounted between openings, and
  // an effect would run a frame after the list is already on screen wearing the last visit's
  // ticks. Same adjust-during-render pattern the quick-add sheet uses.
  const wasVisibleRef = React.useRef(visible);
  if (visible && !wasVisibleRef.current) {
    setQuery('');
    setSelectedIds([]);
  }
  wasVisibleRef.current = visible;

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
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.sheet} edges={SAFE_EDGES}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} hitSlop={HIT_SLOP_8}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Who was with you?</Text>
          <TouchableOpacity
            onPress={handleDone}
            hitSlop={HIT_SLOP_8}
            disabled={!selectedIds.length}
          >
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
      </SafeAreaView>
    </Modal>
  );
}

const SAFE_EDGES = ['top', 'bottom'] as const;

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: Colors.white },
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
