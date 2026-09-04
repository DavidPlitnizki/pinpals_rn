import { DEFAULT_MAP_STYLE } from '../features/map/mapStyles';
import { DEFAULT_PROFILE_NAME, useProfileStore } from './useProfileStore';
import { usePlacesStore } from './usePlacesStore';
import { useRouteStore } from './useRouteStore';
import { useMapStyleStore } from './useMapStyleStore';
import { useOnboardingStore } from './useOnboardingStore';
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
  useMapStyleStore.getState().setStyleId(DEFAULT_MAP_STYLE);
  // Whoever signs in next is new to this device and gets the tour, same as a fresh install.
  useOnboardingStore.getState().resetOnboarding();
}
