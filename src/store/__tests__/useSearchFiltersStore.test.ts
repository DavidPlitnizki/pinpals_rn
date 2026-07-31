import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSearchFiltersStore } from '../useSearchFiltersStore';
import { DEFAULT_RADIUS_M } from '../../features/map/constants';

beforeEach(async () => {
  await AsyncStorage.clear();
  useSearchFiltersStore.setState({
    query: '',
    activeCategories: [],
    specialFilters: [],
    radiusM: DEFAULT_RADIUS_M,
    radiusEnabled: true,
    alwaysShowFavorites: true,
  });
});

// zustand's `set` (and therefore setState) is wrapped by the persist middleware, so
// calling it always re-persists the current in-memory state. To simulate "app cold
// start with existing storage contents" without that write clobbering our fixture,
// we write the persisted JSON directly to AsyncStorage and then rehydrate from it.
async function seedPersistedStorage(state: Record<string, unknown>) {
  await AsyncStorage.setItem('pinpals-search-filters', JSON.stringify({ state, version: 0 }));
}

describe('persistence round-trip', () => {
  it('rehydrates activeCategories and specialFilters arrays after a reload', async () => {
    await seedPersistedStorage({
      query: 'sushi',
      activeCategories: ['food', 'coffee'],
      specialFilters: ['favorites'],
      radiusM: DEFAULT_RADIUS_M,
      radiusEnabled: true,
      alwaysShowFavorites: true,
    });
    await useSearchFiltersStore.persist.rehydrate();

    const state = useSearchFiltersStore.getState();
    expect(state.query).toBe('sushi');
    expect(state.activeCategories).toEqual(['food', 'coffee']);
    expect(state.specialFilters).toEqual(['favorites']);
  });

  it('resetFilters clears persisted state, not just in-memory state', async () => {
    await seedPersistedStorage({
      query: 'park',
      activeCategories: ['nature'],
      specialFilters: [],
      radiusM: 1,
      radiusEnabled: false,
      alwaysShowFavorites: true,
    });
    await useSearchFiltersStore.persist.rehydrate();
    expect(useSearchFiltersStore.getState().query).toBe('park'); // sanity check the seed took effect

    useSearchFiltersStore.getState().resetFilters();
    await new Promise((resolve) => setTimeout(resolve, 50)); // let the persist write flush

    // Simulate a reload: rehydrate straight from whatever resetFilters() persisted.
    await useSearchFiltersStore.persist.rehydrate();

    const state = useSearchFiltersStore.getState();
    expect(state.query).toBe('');
    expect(state.activeCategories).toEqual([]);
    expect(state.radiusM).toBe(DEFAULT_RADIUS_M);
    expect(state.radiusEnabled).toBe(true);
  });

  it('resetFilters does not reset alwaysShowFavorites (a standing preference, not a filter)', () => {
    useSearchFiltersStore.getState().setAlwaysShowFavorites(false);
    useSearchFiltersStore.getState().resetFilters();
    expect(useSearchFiltersStore.getState().alwaysShowFavorites).toBe(false);
  });
});
