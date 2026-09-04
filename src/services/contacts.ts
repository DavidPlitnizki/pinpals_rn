import type * as ContactsModule from 'expo-contacts';

import { logContactsPermission } from './analytics';
import { reportError } from './crashReporting';

// Reading the address book is the most sensitive permission this app asks for, so it reads as
// little as it can get away with: full names, and nothing else. Phone numbers, emails and
// addresses are never requested, never held in memory, and never leave the device — a
// companion on a memory is a name on a note (Phase 1), and that is all this needs to fill in.

export type ContactsAccess =
  // The address book is readable.
  | 'granted'
  // Refused this time, but the system will ask again.
  | 'denied'
  // Refused for good: only Settings can change it now, so there is no point asking again.
  | 'blocked'
  // expo-contacts is not in this build. A dev client built before the dependency was added has
  // neither the native module nor the usage description, and asking anyway is how you get no
  // system prompt and a crash instead of a prompt.
  | 'unavailable';

export interface PhoneContact {
  id: string;
  name: string;
}

// Required lazily, and never with a static import. expo-contacts resolves its native module at
// import time through `requireNativeModule`, which THROWS when the module is not in the binary
// — so a static import takes down every screen that pulls this file in, at startup, before
// anything can catch it. Behind a call-time require the same failure is just a null.
//
// A require rather than `await import()`: Metro and Jest both run this one unchanged, where a
// dynamic import needs --experimental-vm-modules under Jest and would make every test here
// see the "not linked" path regardless of what it was setting up.
//
// Cached: the first call decides, and a device does not grow a native module mid-session.
let cachedModule: typeof ContactsModule | null | undefined;

function loadContacts(): typeof ContactsModule | null {
  if (cachedModule !== undefined) return cachedModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-contacts') as typeof ContactsModule;
    // Present but hollow is as useless as absent — check the call this file actually makes.
    cachedModule = typeof module.Contact?.getAllDetails === 'function' ? module : null;
  } catch (err) {
    reportError('contacts', err, 'expo-contacts is not linked into this build');
    cachedModule = null;
  }

  return cachedModule;
}

// Synchronous, so the UI can decide whether to offer the address book at all rather than
// offering it and then apologising. False on a build without the native module.
export function isContactsAvailable(): boolean {
  return loadContacts() !== null;
}

export async function requestContactsAccess(): Promise<ContactsAccess> {
  const contacts = loadContacts();
  if (!contacts) {
    logContactsPermission('unavailable');
    return 'unavailable';
  }

  try {
    const { granted, canAskAgain } = await contacts.requestPermissionsAsync();
    const access = granted ? 'granted' : canAskAgain ? 'denied' : 'blocked';
    logContactsPermission(access);
    return access;
  } catch (err) {
    // A permission call that throws is not a refusal, but it is not access either — treat it
    // as unavailable so the caller falls back to typing rather than showing a broken picker.
    reportError('contacts', err, 'permission request failed');
    logContactsPermission('failed');
    return 'unavailable';
  }
}

// What the system currently thinks, without prompting. Used to decide whether pressing the
// button should ask, go straight to Settings, or quietly do nothing at all.
export async function getContactsAccess(): Promise<ContactsAccess> {
  const contacts = loadContacts();
  if (!contacts) return 'unavailable';

  try {
    const { granted, canAskAgain } = await contacts.getPermissionsAsync();
    return granted ? 'granted' : canAskAgain ? 'denied' : 'blocked';
  } catch (err) {
    reportError('contacts', err, 'permission check failed');
    return 'unavailable';
  }
}

// Named contacts only, de-duplicated and sorted. A device address book is full of entries with
// no name at all — a bare number, a service account — and those are nothing to pick from.
//
// `Contact.getAllDetails(fields)` rather than the legacy `getContactsAsync`: the legacy call
// still type-checks in expo-contacts 57 but is a stub that throws at runtime. The field list
// is enforced by the return type here, so widening the read cannot happen by accident.
//
// No `sortOrder` requested here — the list below is sorted by display name anyway (given-name
// order isn't guaranteed to match it), so asking the native side to sort first would just be
// work that gets thrown away.
export async function loadContactNames(): Promise<PhoneContact[]> {
  const contacts = loadContacts();
  if (!contacts) return [];

  try {
    const details = await contacts.Contact.getAllDetails([contacts.ContactField.FULL_NAME]);

    const seen = new Set<string>();
    const named: PhoneContact[] = [];

    for (const contact of details) {
      const name = (contact.fullName ?? '').trim();
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

// Tests only: the module handle is cached for the life of the process, and each case needs its
// own verdict on whether expo-contacts is linked.
export function resetContactsModuleCacheForTests(): void {
  cachedModule = undefined;
}
