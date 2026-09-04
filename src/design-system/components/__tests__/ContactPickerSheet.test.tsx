import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { ContactPickerSheet } from '../ContactPickerSheet';

const noop = () => {};
const NO_COMPANIONS: string[] = [];
const CONTACTS = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Grace Hopper' },
];

describe('ContactPickerSheet', () => {
  it('does nothing on an empty Return/Done press', () => {
    const onAdd = jest.fn();
    render(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={onAdd}
        onClose={noop}
      />,
    );

    fireEvent(screen.getByPlaceholderText('Search or type a name'), 'submitEditing');

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds whatever was typed, on Return/Done, even when nothing in the address book matches it', () => {
    const onAdd = jest.fn();
    render(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={onAdd}
        onClose={noop}
      />,
    );

    const field = screen.getByPlaceholderText('Search or type a name');
    fireEvent.changeText(field, 'Zoe');
    // No row for "Zoe" — the list has narrowed to nothing, which is exactly the case where
    // typing is the only way in.
    expect(screen.queryByText('Zoe')).toBeNull();

    fireEvent(field, 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Zoe');
  });

  it('adds a contact straight from the list on tap', () => {
    const onAdd = jest.fn();
    render(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={onAdd}
        onClose={noop}
      />,
    );

    fireEvent.press(screen.getByLabelText('Ada Lovelace'));

    expect(onAdd).toHaveBeenCalledWith('Ada Lovelace');
  });

  it('marks a contact already on the memory as done rather than lets it be picked twice', () => {
    render(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={['Ada Lovelace']}
        onAdd={noop}
        onClose={noop}
      />,
    );

    expect(screen.getByLabelText('Ada Lovelace')).toBeDisabled();
  });

  it('picks up a row becoming already-added mid-session and blocks a second tap on it', () => {
    const onAdd = jest.fn();
    // alreadyAdded starts empty and gets updated the way a real caller would: re-rendering
    // with whatever onAdd just added, same as the parent screen does on every companions change.
    const { rerender } = render(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={onAdd}
        onClose={noop}
      />,
    );

    fireEvent.press(screen.getByLabelText('Ada Lovelace'));
    expect(onAdd).toHaveBeenCalledTimes(1);

    rerender(
      <ContactPickerSheet
        access="granted"
        contacts={CONTACTS}
        loading={false}
        alreadyAdded={['Ada Lovelace']}
        onAdd={onAdd}
        onClose={noop}
      />,
    );

    expect(screen.getByLabelText('Ada Lovelace')).toBeDisabled();

    fireEvent.press(screen.getByLabelText('Ada Lovelace'));
    // Still just the one call — a second tap on an already-added row is a no-op, not a removal.
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('shows no list at all when the address book was refused', () => {
    render(
      <ContactPickerSheet
        access="denied"
        contacts={[]}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={noop}
        onClose={noop}
      />,
    );

    // Neither a contact row nor an empty-list message — there is no list here at all, only
    // the field to type into.
    expect(screen.queryByLabelText('Ada Lovelace')).toBeNull();
    expect(screen.getByText('Contacts are off, so typing is how this fills in.')).toBeTruthy();
  });

  it('offers Settings only once the system has stopped asking', () => {
    render(
      <ContactPickerSheet
        access="blocked"
        contacts={[]}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={noop}
        onClose={noop}
      />,
    );

    expect(screen.getByText('Open Settings')).toBeTruthy();
  });

  it('says nothing about permissions at all on a build without the native module', () => {
    // Not a user-actionable state — nothing to explain, just a field that only ever types.
    render(
      <ContactPickerSheet
        access="unavailable"
        contacts={[]}
        loading={false}
        alreadyAdded={NO_COMPANIONS}
        onAdd={noop}
        onClose={noop}
      />,
    );

    expect(screen.queryByText(/[Cc]ontacts are off/)).toBeNull();
    expect(screen.queryByText('Open Settings')).toBeNull();
  });

  it('shows a loading indicator while permission is still being resolved, not a hint or a list', () => {
    render(
      <ContactPickerSheet
        access={null}
        contacts={[]}
        loading
        alreadyAdded={NO_COMPANIONS}
        onAdd={noop}
        onClose={noop}
      />,
    );

    expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
    expect(screen.queryByText(/off/)).toBeNull();
  });
});
