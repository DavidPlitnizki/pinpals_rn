import * as Contacts from 'expo-contacts';

import {
  getContactsAccess,
  loadContactNames,
  requestContactsAccess,
  resetContactsModuleCacheForTests,
} from '../contacts';

const mockLogContactsPermission = jest.fn();
jest.mock('../crashReporting', () => ({ reportError: jest.fn() }));
jest.mock('../analytics', () => ({
  logContactsPermission: (...args: unknown[]) => mockLogContactsPermission(...args),
}));

const mockRequest = Contacts.requestPermissionsAsync as jest.Mock;
const mockGet = Contacts.getPermissionsAsync as jest.Mock;
const mockGetAllDetails = Contacts.Contact.getAllDetails as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  resetContactsModuleCacheForTests();
});

describe('contacts permission', () => {
  it('separates a refusal that can be asked again from one that cannot', async () => {
    mockRequest.mockResolvedValueOnce({ granted: false, canAskAgain: true });
    expect(await requestContactsAccess()).toBe('denied');

    // Only Settings can change this one, so the caller must stop asking and say so instead.
    mockRequest.mockResolvedValueOnce({ granted: false, canAskAgain: false });
    expect(await requestContactsAccess()).toBe('blocked');
  });

  it('reports every outcome, so a build that never prompts is visible without a bug report', async () => {
    mockRequest.mockResolvedValueOnce({ granted: true, canAskAgain: false });

    await requestContactsAccess();

    expect(mockLogContactsPermission).toHaveBeenCalledWith('granted');
  });

  it('treats a permission call that throws as unavailable, not as a refusal', async () => {
    mockGet.mockRejectedValueOnce(new Error('native module missing'));

    // Not access, and not a crash either — the field falls back to typing.
    expect(await getContactsAccess()).toBe('unavailable');
  });
});

describe('when expo-contacts is not in the build', () => {
  // Exactly the dev client that shipped before this dependency was added: no native module and
  // no usage description. Asking anyway produced no system prompt and a crash.
  function unlinkNativeModule() {
    const linked = Contacts.Contact.getAllDetails;
    (Contacts.Contact as unknown as { getAllDetails?: unknown }).getAllDetails = undefined;
    return () => {
      (Contacts.Contact as unknown as { getAllDetails?: unknown }).getAllDetails = linked;
    };
  }

  it('says so instead of prompting', async () => {
    const restore = unlinkNativeModule();
    try {
      expect(await getContactsAccess()).toBe('unavailable');
      expect(await requestContactsAccess()).toBe('unavailable');
      expect(mockRequest).not.toHaveBeenCalled();
      expect(mockLogContactsPermission).toHaveBeenCalledWith('unavailable');
    } finally {
      restore();
    }
  });

  it('returns no contacts rather than calling into a module that is not there', async () => {
    const restore = unlinkNativeModule();
    try {
      expect(await loadContactNames()).toEqual([]);
      expect(mockGetAllDetails).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });
});

describe('loadContactNames', () => {
  it('asks the address book for names and nothing else', async () => {
    mockGetAllDetails.mockResolvedValueOnce([]);

    await loadContactNames();

    // The permission string promises numbers and emails are never read. This is that promise:
    // the field list is the whole of what the native side is asked to return.
    expect(mockGetAllDetails).toHaveBeenCalledWith([Contacts.ContactField.FULL_NAME]);
  });

  it('drops the nameless, folds duplicates and sorts what is left', async () => {
    mockGetAllDetails.mockResolvedValueOnce([
      { id: '1', fullName: 'Grace Hopper' },
      { id: '2', fullName: '   ' },
      { id: '3', fullName: 'Ada Lovelace' },
      // A real address book carries the same person twice — one entry per SIM, per account.
      { id: '4', fullName: 'ada lovelace' },
      { id: '5', fullName: null },
    ]);

    const contacts = await loadContactNames();

    expect(contacts.map((c) => c.name)).toEqual(['Ada Lovelace', 'Grace Hopper']);
  });

  it('returns an empty list rather than throwing when the read fails', async () => {
    mockGetAllDetails.mockRejectedValueOnce(new Error('permission revoked mid-read'));

    expect(await loadContactNames()).toEqual([]);
  });
});
