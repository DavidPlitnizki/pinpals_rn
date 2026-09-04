import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockGetAccess = jest.fn(() => Promise.resolve('denied' as const));
const mockRequestAccess = jest.fn(() => Promise.resolve('denied' as const));
const mockLoadNames = jest.fn(() => Promise.resolve([{ id: '1', name: 'Ada Lovelace' }]));

jest.mock('../../../services/contacts', () => ({
  getContactsAccess: () => mockGetAccess(),
  requestContactsAccess: () => mockRequestAccess(),
  loadContactNames: () => mockLoadNames(),
}));

// eslint-disable-next-line import/first
import { CompanionInput } from '../CompanionInput';

const noop = () => {};
const NO_COMPANIONS: string[] = [];

const mockAlert = Alert.alert as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CompanionInput', () => {
  it('still takes a typed name, address book or no address book', () => {
    const onAdd = jest.fn();
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={onAdd} onRemove={noop} />);

    const field = screen.getByPlaceholderText('Name...');
    fireEvent.changeText(field, '  Grace  ');
    fireEvent(field, 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Grace');
  });

  it('explains what was turned down instead of leaving the button dead', async () => {
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={noop} onRemove={noop} />);

    fireEvent.press(screen.getByLabelText('Pick from contacts'));

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    const [title, body, buttons] = mockAlert.mock.calls[0];
    expect(title).toBe('Contacts are off');
    expect(body).toContain('only ever reads names');
    // Still askable, so there is nothing to send anyone to Settings for.
    expect(buttons).toBeUndefined();
  });

  it('offers Settings once the system will not ask again', async () => {
    mockGetAccess.mockResolvedValueOnce('blocked' as never);
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={noop} onRemove={noop} />);

    fireEvent.press(screen.getByLabelText('Pick from contacts'));

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    const buttons = mockAlert.mock.calls[0][2];
    expect(buttons.map((b: { text: string }) => b.text)).toEqual(['Not now', 'Open Settings']);
    // Asking again would show the user nothing — the system has stopped prompting.
    expect(mockRequestAccess).not.toHaveBeenCalled();
  });

  it('opens the picker on the names it is given once access is granted', async () => {
    mockGetAccess.mockResolvedValueOnce('granted' as never);
    render(<CompanionInput companions={NO_COMPANIONS} onAdd={noop} onRemove={noop} />);

    fireEvent.press(screen.getByLabelText('Pick from contacts'));

    expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('adds everyone ticked, and never the same person twice', async () => {
    const onAdd = jest.fn();
    mockGetAccess.mockResolvedValueOnce('granted' as never);
    mockLoadNames.mockResolvedValueOnce([
      { id: '1', name: 'Ada Lovelace' },
      { id: '2', name: 'Grace Hopper' },
    ]);
    render(<CompanionInput companions={['Grace Hopper']} onAdd={onAdd} onRemove={noop} />);

    fireEvent.press(screen.getByLabelText('Pick from contacts'));
    fireEvent.press(await screen.findByLabelText('Ada Lovelace'));
    // Already on the memory: the row is inert, so this press must not select anything.
    fireEvent.press(screen.getByLabelText('Grace Hopper'));
    fireEvent.press(screen.getByText('Done'));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith('Ada Lovelace');
  });
});
