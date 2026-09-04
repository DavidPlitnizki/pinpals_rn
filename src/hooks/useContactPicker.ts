import { useCallback, useRef, useState } from 'react';

import {
  ContactsAccess,
  getContactsAccess,
  loadContactNames,
  PhoneContact,
  requestContactsAccess,
} from '../services/contacts';
import { reportError } from '../services/crashReporting';

export interface ContactPicker {
  visible: boolean;
  // Null until access has been resolved for this opening. The sheet uses this to decide
  // whether to show the address book list, an inline "contacts are off" note, or neither —
  // never a blocking system-style alert. Typing keeps working regardless of what this is.
  access: ContactsAccess | null;
  contacts: PhoneContact[];
  loading: boolean;
  open: () => void;
  close: () => void;
}

// The permission dance and the loaded address book, kept out of the components so that the two
// screens with a companion field share one copy of it — and so the picker itself can be
// rendered by whoever owns a full-screen box to put it in. It cannot be a Modal: on the map,
// the companion field lives inside the quick-add sheet, and a second native Modal on top of
// that one leaves iOS's touch-responder chain broken after both dismiss.
//
// The sheet opens unconditionally — there is no permission gate in front of it. It is a
// manual-entry field with an address book attached, not the other way around, so refusing (or
// a build missing the native module entirely) still leaves a working way to type a name.
export function useContactPicker(): ContactPicker {
  const [visible, setVisible] = useState(false);
  const [access, setAccess] = useState<ContactsAccess | null>(null);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);

  // Bumped on every open() and close(), so a slow open() from a previous opening (e.g. the user
  // closed the sheet and immediately reopened it before the first permission check settled)
  // can tell it's stale and drop its result instead of clobbering the current opening's state.
  const requestIdRef = useRef(0);

  // The address book itself rarely changes mid-session, so once it's been read it's kept here
  // and reused across opens — reopening the sheet shouldn't re-pay the native bridge cost of
  // re-reading the whole contacts table every time. Permission is still re-checked on every
  // open, since that can change (Settings) without the app restarting.
  const contactsCacheRef = useRef<PhoneContact[] | null>(null);

  const open = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setVisible(true);
    setLoading(true);

    void (async () => {
      try {
        // Only 'denied' is worth prompting — 'blocked' means the system has stopped asking and
        // would just silently answer "no" again, and 'granted'/'unavailable' have nothing to
        // ask for. The result renders as an inline note in the sheet, never a blocking alert.
        const current = await getContactsAccess();
        const resolved = current === 'denied' ? await requestContactsAccess() : current;
        if (requestIdRef.current !== requestId) return;
        setAccess(resolved);

        if (resolved === 'granted') {
          if (!contactsCacheRef.current) {
            contactsCacheRef.current = await loadContactNames();
            if (requestIdRef.current !== requestId) return;
          }
          setContacts(contactsCacheRef.current);
        }
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        // The service is written to swallow its own failures, so reaching here is already a
        // surprise. Fall back to "no address book, manual entry only" rather than propagate an
        // unhandled rejection into the app's global handler, which reports it as a fatal.
        reportError('contacts', err, 'opening the contact picker failed');
        setAccess('unavailable');
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    })();
  }, []);

  const close = useCallback(() => {
    // Invalidates any still-in-flight open() from this opening.
    requestIdRef.current++;
    setVisible(false);
    // Cleared rather than kept: the user may grant access from Settings mid-session, and the
    // next opening should ask again instead of replaying a stale refusal. The loaded contacts
    // list itself (contactsCacheRef) is deliberately left alone — see its comment above.
    setAccess(null);
    setContacts([]);
  }, []);

  return { visible, access, contacts, loading, open, close };
}
