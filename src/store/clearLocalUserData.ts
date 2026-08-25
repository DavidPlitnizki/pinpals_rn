import { DEFAULT_PROFILE_NAME, useProfileStore } from './useProfileStore';
import { usePlacesStore } from './usePlacesStore';
import { useRouteStore } from './useRouteStore';
import { useSearchFiltersStore } from './useSearchFiltersStore';

// Wipes everything the signed-in person put into the app, in one place so a new persisted
// store can't quietly escape account deletion — which is exactly what happened before this
// existed: deletion cleared places and profile, while the active route (with the labels and
// coordinates of somewhere they had navigated to) and the last search query stayed behind on
// the device, both contradicting a policy that promises deletion removes everything.
//
// Every persisted store, with no exceptions: after this the app is in the state it would be
// in on a fresh install. Add new persisted stores here — the active route escaped account
// deletion for exactly as long as this list was maintained per-call-site instead.
export function clearLocalUserData(): void {
  usePlacesStore.setState({ places: [], notes: [] });
  useProfileStore.setState({ profile: { id: '1', name: DEFAULT_PROFILE_NAME } });
  useRouteStore.getState().clearRoute();
  useSearchFiltersStore.getState().resetFilters();
}
