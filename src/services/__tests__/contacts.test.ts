import * as Contacts from 'expo-contacts';

import { getContactsAccess, loadContactNames, requestContactsAccess } from '../contacts';

jest.mock('../crashReporting', () => ({ reportError: jest.fn() }));

const mockRequest = Contacts.requestPermissionsAsync as jest.Mock;
const mockGet = Contacts.getPermissionsAsync as jest.Mock;
const mockGetContacts = Contacts.getContactsAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('contacts permission', () => {
  it('separates a refusal that can be asked again from one that cannot', async () => {
    mockRequest.mockResolvedValueOnce({ granted: false, canAskAgain: true });
    expect(await requestContactsAccess()).toBe('denied');

    // Only Settings can change this one, so the caller must stop asking and say so instead.
    mockRequest.mockResolvedValueOnce({ granted: false, canAskAgain: false });
    expect(await requestContactsAccess()).toBe('blocked');
  });

  it('treats a permission call that throws as a plain no', async () => {
    mockGet.mockRejectedValueOnce(new Error('native module missing'));

    // Not access, and not a crash either — the field falls back to typing.
    expect(await getContactsAccess()).toBe('denied');
  });
});

describe('loadContactNames', () => {
  it('asks the address book for names and nothing else', async () => {
    mockGetContacts.mockResolvedValueOnce({ data: [] });

    await loadContactNames();

    // The permission string promises numbers and emails are never read. This is that promise.
    expect(mockGetContacts).toHaveBeenCalledWith({ fields: [Contacts.Fields.Name] });
  });

  it('drops the nameless, folds duplicates and sorts what is left', async () => {
    mockGetContacts.mockResolvedValueOnce({
      data: [
        { id: '1', name: 'Grace Hopper' },
        { id: '2', name: '   ' },
        { id: '3', name: 'Ada Lovelace' },
        // A real address book carries the same person twice — one entry per SIM, per account.
        { id: '4', name: 'ada lovelace' },
        { id: '5', name: undefined },
      ],
    });

    const contacts = await loadContactNames();

    expect(contacts.map((c) => c.name)).toEqual(['Ada Lovelace', 'Grace Hopper']);
  });

  it('returns an empty list rather than throwing when the read fails', async () => {
    mockGetContacts.mockRejectedValueOnce(new Error('permission revoked mid-read'));

    expect(await loadContactNames()).toEqual([]);
  });
});
