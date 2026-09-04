import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

import {
  getContactsAccess,
  isContactsAvailable,
  loadContactNames,
  PhoneContact,
  requestContactsAccess,
} from '../services/contacts';

// Shown when the address book is refused. The field it belongs to still works exactly as it
// did before contacts existed, so this explains what was declined rather than blocking anything.
const DENIED_TITLE = 'Contacts are off';
const DENIED_BODY =
  'Pinpals can fill in who you were with from your address book. It only ever reads names — ' +
  'never numbers or emails. You can still type names in yourself.';

export interface ContactPicker {
  // False on a build without expo-contacts linked. The caller offers no button at all then:
  // one that can only apologise is worse than none.
  available: boolean;
  visible: boolean;
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
export function useContactPicker(): ContactPicker {
  const [available] = useState(isContactsAvailable);
  const [visible, setVisible] = useState(false);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);

  const open = useCallback(() => {
    void (async () => {
      // Only 'denied' is worth a prompt. 'blocked' means the system has stopped asking, and
      // requesting again shows the user nothing while quietly answering "no" — which would put
      // the wrong alert on screen, the one without a way to fix it.
      const current = await getContactsAccess();
      const access = current === 'denied' ? await requestContactsAccess() : current;

      // The button is not offered in this case, so reaching here means the module went away
      // between render and press. Nothing to say about it — the field still works.
      if (access === 'unavailable') return;

      if (access === 'blocked') {
        Alert.alert(DENIED_TITLE, DENIED_BODY, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }

      if (access !== 'granted') {
        Alert.alert(DENIED_TITLE, DENIED_BODY);
        return;
      }

      setVisible(true);
      setLoading(true);
      const loaded = await loadContactNames();
      setContacts(loaded);
      setLoading(false);
    })();
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return { available, visible, contacts, loading, open, close };
}
