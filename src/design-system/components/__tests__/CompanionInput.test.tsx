import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CompanionInput } from '../CompanionInput';

const noop = () => {};
const NO_COMPANIONS: string[] = [];

describe('CompanionInput', () => {
  it('still takes a typed name, address book or no address book', () => {
    const onAdd = jest.fn();
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={onAdd} onRemove={noop} />);

    const field = screen.getByPlaceholderText('Name...');
    fireEvent.changeText(field, '  Grace  ');
    fireEvent(field, 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Grace');
  });

  it('offers no address book when the caller has none to give', () => {
    // A build without expo-contacts linked, or a screen with nowhere to put the picker. A
    // button that can only apologise is worse than no button — this is the field exactly as
    // it was before contacts existed.
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={noop} onRemove={noop} />);

    expect(screen.queryByLabelText('Pick from contacts')).toBeNull();
    expect(screen.getByPlaceholderText('Name...')).toBeTruthy();
  });

  it('hands the address book button back to the caller', () => {
    const onPickFromContacts = jest.fn();
    render(
      <CompanionInput
        companions={NO_COMPANIONS}
        onAdd={noop}
        onRemove={noop}
        onPickFromContacts={onPickFromContacts}
      />,
    );

    fireEvent.press(screen.getByLabelText('Pick from contacts'));

    expect(onPickFromContacts).toHaveBeenCalledTimes(1);
  });

  it('gives the row back to "+" the moment a name is being typed', () => {
    render(
      <CompanionInput
        companions={NO_COMPANIONS}
        onAdd={noop}
        onRemove={noop}
        onPickFromContacts={noop}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Name...'), 'Ada');

    // One control, not two: typing a name still leads to the same button it always did.
    expect(screen.queryByLabelText('Pick from contacts')).toBeNull();
  });
});
