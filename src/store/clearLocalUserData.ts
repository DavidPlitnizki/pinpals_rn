import { DEFAULT_PROFILE_NAME, useProfileStore } from './useProfileStore';
import { usePlacesStore } from './usePlacesStore';
import { useRouteStore } from './useRouteStore';
import { useSearchFiltersStore } from './useSearchFiltersStore';
import { useSettingsStore } from './useSettingsStore';

// Wipes everything the signed-in person put into the app, in one place so a new persisted
// store can't quietly escape account deletion — which is exactly what happened before this
// existed: deletion cleared places and profile, while the active route (with the labels and
// coordinates of somewhere they had navigated to) and the last search query stayed behind on
// the device, both contradicting a policy that promises deletion removes everything.
//
// Every persisted store, with no exceptions: after this the app is in the state it would be
// in on a fresh install. Settings are included even though they are device preferences rather
// than personal data — there is no UI to change them today, so nothing of the user's is being
// discarded, and "deletes everything" is a promise that is easier to keep when it has no
// carve-outs to remember.
export function clearLocalUserData(): void {
  usePlacesStore.setState({ places: [], notes: [] });
  useProfileStore.setState({ profile: { id: '1', name: DEFAULT_PROFILE_NAME } });
  useRouteStore.getState().clearRoute();
  useSearchFiltersStore.getState().resetFilters();
  useSettingsStore.setState({ fontScale: 'medium', theme: 'system' });
}
