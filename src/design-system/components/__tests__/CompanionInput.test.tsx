import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CompanionInput } from '../CompanionInput';

const noop = () => {};
const NO_COMPANIONS: string[] = [];

describe('CompanionInput', () => {
  it('opens the picker on press — it is a button dressed as a field, not a text input', () => {
    const onOpenPicker = jest.fn();
    render(
      <CompanionInput companions={NO_COMPANIONS} onRemove={noop} onOpenPicker={onOpenPicker} />,
    );

    fireEvent.press(screen.getByLabelText('Add someone you were with'));

    expect(onOpenPicker).toHaveBeenCalledTimes(1);
  });

  it('shows every companion already added, each removable on its own', () => {
    const onRemove = jest.fn();
    render(
      <CompanionInput
        companions={['Ada Lovelace', 'Grace Hopper']}
        onRemove={onRemove}
        onOpenPicker={noop}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Grace Hopper')).toBeTruthy();

    fireEvent.press(screen.getAllByText('✕')[0]);
    expect(onRemove).toHaveBeenCalledWith('Ada Lovelace');
  });

  it('does nothing when there is nowhere to open a picker to', () => {
    // No onOpenPicker: the field still renders (so the chips stay visible) but presses are
    // inert rather than throwing on an undefined handler.
    render(<CompanionInput companions={NO_COMPANIONS} onRemove={noop} />);

    fireEvent.press(screen.getByLabelText('Add someone you were with'));
    // Nothing to assert beyond "did not throw" — there is no picker to have opened.
  });
});
