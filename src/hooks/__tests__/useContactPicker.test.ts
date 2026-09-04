import { act, renderHook } from '@testing-library/react-native';

const mockGetAccess = jest.fn(() => Promise.resolve('denied' as string));
const mockRequestAccess = jest.fn(() => Promise.resolve('denied' as string));
const mockLoadNames = jest.fn(() => Promise.resolve([{ id: '1', name: 'Ada Lovelace' }]));

jest.mock('../../services/contacts', () => ({
  getContactsAccess: () => mockGetAccess(),
  requestContactsAccess: () => mockRequestAccess(),
  loadContactNames: () => mockLoadNames(),
}));

// eslint-disable-next-line import/first
import { useContactPicker } from '../useContactPicker';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccess.mockResolvedValue('denied');
  mockRequestAccess.mockResolvedValue('denied');
});

describe('useContactPicker', () => {
  it('opens immediately, without waiting on permission first — typing must never be blocked', async () => {
    // Held open so the assertion lands before the permission call resolves and settles state
    // a second time — this checks the synchronous half of open(), not the eventual outcome.
    let resolveAccess: (value: string) => void = () => {};
    mockGetAccess.mockReturnValueOnce(new Promise((resolve) => (resolveAccess = resolve)));

    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());

    // Visible on the same tick `open` was called, before any permission call has resolved.
    expect(result.current.visible).toBe(true);
    expect(result.current.loading).toBe(true);

    await act(async () => resolveAccess('denied'));
  });

  it('prompts once on a plain refusal, and lands on the resolved access', async () => {
    mockGetAccess.mockResolvedValueOnce('denied');
    mockRequestAccess.mockResolvedValueOnce('denied');
    const { result } = renderHook(() => useContactPicker());

    await act(async () => result.current.open());

    expect(mockRequestAccess).toHaveBeenCalledTimes(1);
    expect(result.current.access).toBe('denied');
    expect(result.current.contacts).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not re-prompt once the system has stopped asking', async () => {
    mockGetAccess.mockResolvedValueOnce('blocked');
    const { result } = renderHook(() => useContactPicker());

    await act(async () => result.current.open());

    expect(result.current.access).toBe('blocked');
    // A re-request here would silently answer "no" again — nothing to show for it.
    expect(mockRequestAccess).not.toHaveBeenCalled();
  });

  it('loads the address book only once access is actually granted', async () => {
    mockGetAccess.mockResolvedValueOnce('granted');
    const { result } = renderHook(() => useContactPicker());

    await act(async () => result.current.open());

    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.access).toBe('granted');
  });

  it('falls back to unavailable rather than letting a thrown permission call escape', async () => {
    mockGetAccess.mockRejectedValueOnce(new Error('native module missing'));
    const { result } = renderHook(() => useContactPicker());

    await act(async () => result.current.open());

    expect(result.current.access).toBe('unavailable');
    expect(result.current.loading).toBe(false);
  });

  it('forgets the previous answer on close, so Settings changes are picked up next time', async () => {
    mockGetAccess.mockResolvedValueOnce('granted');
    const { result } = renderHook(() => useContactPicker());
    await act(async () => result.current.open());
    expect(result.current.access).toBe('granted');

    act(() => result.current.close());

    expect(result.current.visible).toBe(false);
    expect(result.current.access).toBeNull();
    expect(result.current.contacts).toEqual([]);
  });

  it('does not re-read the address book on a second opening once it has already been loaded', async () => {
    mockGetAccess.mockResolvedValue('granted');
    const { result } = renderHook(() => useContactPicker());

    await act(async () => result.current.open());
    expect(mockLoadNames).toHaveBeenCalledTimes(1);

    act(() => result.current.close());
    await act(async () => result.current.open());

    // Permission is checked again (it can change in Settings), but the address book itself
    // doesn't change mid-session, so the second opening reuses what the first one already read.
    expect(mockGetAccess).toHaveBeenCalledTimes(2);
    expect(mockLoadNames).toHaveBeenCalledTimes(1);
    expect(result.current.contacts).toHaveLength(1);
  });

  it('ignores a still-in-flight opening once it has been closed and reopened', async () => {
    let resolveFirst: (value: string) => void = () => {};
    mockGetAccess.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));
    const { result } = renderHook(() => useContactPicker());

    act(() => result.current.open());
    act(() => result.current.close());
    mockGetAccess.mockResolvedValueOnce('blocked');
    await act(async () => result.current.open());

    expect(result.current.access).toBe('blocked');

    // The first opening's permission check finally resolves — its result must not overwrite
    // what the second, current opening already landed on.
    await act(async () => resolveFirst('granted'));

    expect(result.current.access).toBe('blocked');
    expect(result.current.contacts).toEqual([]);
  });
});
