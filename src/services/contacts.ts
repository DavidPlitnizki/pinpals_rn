import * as Contacts from 'expo-contacts';

import { reportError } from './crashReporting';

// Reading the address book is the most sensitive permission this app asks for, so it reads as
// little as it can get away with: names, and nothing else. Phone numbers, emails and addresses
// are never requested, never held in memory, and never leave the device — a companion on a
// memory is a name on a note (Phase 1), and that is all this needs to fill in.

export type ContactsAccess =
  // The address book is readable.
  | 'granted'
  // Refused this time, but the system will ask again.
  | 'denied'
  // Refused for good: only Settings can change it now, so there is no point asking again.
  | 'blocked';

export interface PhoneContact {
  id: string;
  name: string;
}

export async function requestContactsAccess(): Promise<ContactsAccess> {
  try {
    const { granted, canAskAgain } = await Contacts.requestPermissionsAsync();
    if (granted) return 'granted';
    return canAskAgain ? 'denied' : 'blocked';
  } catch (err) {
    // A permission call that throws is not a refusal, but it is not access either — treat it
    // as a plain no so the caller falls back to typing rather than showing a broken picker.
    reportError('contacts', err, 'permission request failed');
    return 'denied';
  }
}

// What the system currently thinks, without prompting. Used to decide whether pressing the
// button should ask or go straight to Settings.
export async function getContactsAccess(): Promise<ContactsAccess> {
  try {
    const { granted, canAskAgain } = await Contacts.getPermissionsAsync();
    if (granted) return 'granted';
    return canAskAgain ? 'denied' : 'blocked';
  } catch (err) {
    reportError('contacts', err, 'permission check failed');
    return 'denied';
  }
}

// Named contacts only, de-duplicated and sorted. A device address book is full of entries with
// no name at all (a bare number, a service account) — those are nothing to pick from.
export async function loadContactNames(): Promise<PhoneContact[]> {
  try {
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name] });

    const seen = new Set<string>();
    const named: PhoneContact[] = [];

    for (const contact of data) {
      const name = (contact.name ?? '').trim();
      if (!name) continue;

      const key = name.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      named.push({ id: contact.id ?? name, name });
    }

    return named.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    reportError('contacts', err, 'reading contacts failed');
    return [];
  }
}
