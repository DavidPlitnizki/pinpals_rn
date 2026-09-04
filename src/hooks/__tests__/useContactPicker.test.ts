import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

const mockGetAccess = jest.fn(() => Promise.resolve('denied' as string));
const mockRequestAccess = jest.fn(() => Promise.resolve('denied' as string));
const mockLoadNames = jest.fn(() => Promise.resolve([{ id: '1', name: 'Ada Lovelace' }]));
const mockIsAvailable = jest.fn(() => true);

jest.mock('../../services/contacts', () => ({
  isContactsAvailable: () => mockIsAvailable(),
  getContactsAccess: () => mockGetAccess(),
  requestContactsAccess: () => mockRequestAccess(),
  loadContactNames: () => mockLoadNames(),
}));

// eslint-disable-next-line import/first
import { useContactPicker } from '../useContactPicker';

const mockAlert = Alert.alert as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAvailable.mockReturnValue(true);
  mockGetAccess.mockResolvedValue('denied');
  mockRequestAccess.mockResolvedValue('denied');
});

describe('useContactPicker', () => {
  it('reports nothing to offer on a build without the native module', () => {
    // Exactly the dev client that shipped before expo-contacts was a dependency: no module,
    // no usage description. Asking anyway produced no system prompt and a crash.
    mockIsAvailable.mockReturnValue(false);

    const { result } = renderHook(() => useContactPicker());

    expect(result.current.available).toBe(false);
  });

  it('explains what was turned down instead of opening an empty picker', async () => {
    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    const [title, body, buttons] = mockAlert.mock.calls[0];
    expect(title).toBe('Contacts are off');
    expect(body).toContain('only ever reads names');
    // Still askable, so there is nothing to send anyone to Settings for.
    expect(buttons).toBeUndefined();
    expect(result.current.visible).toBe(false);
  });

  it('offers Settings once the system will not ask again, and stops asking', async () => {
    mockGetAccess.mockResolvedValueOnce('blocked');
    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    const buttons = mockAlert.mock.calls[0][2];
    expect(buttons.map((b: { text: string }) => b.text)).toEqual(['Not now', 'Open Settings']);
    // Re-requesting here shows the user nothing and quietly answers "no" — which would have
    // put the other alert on screen, the one with no way out of it.
    expect(mockRequestAccess).not.toHaveBeenCalled();

    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    buttons[1].onPress();
    expect(settings).toHaveBeenCalled();
    settings.mockRestore();
  });

  it('says nothing at all when the module goes missing between render and press', async () => {
    mockGetAccess.mockResolvedValueOnce('unavailable');
    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());

    await waitFor(() => expect(mockGetAccess).toHaveBeenCalled());
    // There is nothing useful to tell the user here, and the field still works.
    expect(mockAlert).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
  });

  it('opens on the loaded address book once access is granted', async () => {
    mockGetAccess.mockResolvedValueOnce('granted');
    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());

    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    expect(result.current.visible).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(mockAlert).not.toHaveBeenCalled();
  });
});
