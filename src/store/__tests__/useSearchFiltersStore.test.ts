import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSearchFiltersStore } from '../useSearchFiltersStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useSearchFiltersStore.setState({ query: '' });
});

// zustand's `set` (and therefore setState) is wrapped by the persist middleware, so
// calling it always re-persists the current in-memory state. To simulate "app cold
// start with existing storage contents" without that write clobbering our fixture,
// we write the persisted JSON directly to AsyncStorage and then rehydrate from it.
async function seedPersistedStorage(state: Record<string, unknown>) {
  await AsyncStorage.setItem('pinpals-search-filters', JSON.stringify({ state, version: 0 }));
}

describe('persistence round-trip', () => {
  it('rehydrates query after a reload', async () => {
    await seedPersistedStorage({ query: 'sushi' });
    await useSearchFiltersStore.persist.rehydrate();

    expect(useSearchFiltersStore.getState().query).toBe('sushi');
  });

  it('resetFilters clears persisted state, not just in-memory state', async () => {
    await seedPersistedStorage({ query: 'park' });
    await useSearchFiltersStore.persist.rehydrate();
    expect(useSearchFiltersStore.getState().query).toBe('park'); // sanity check the seed took effect

    useSearchFiltersStore.getState().resetFilters();
    await new Promise((resolve) => setTimeout(resolve, 50)); // let the persist write flush

    // Simulate a reload: rehydrate straight from whatever resetFilters() persisted.
    await useSearchFiltersStore.persist.rehydrate();

    expect(useSearchFiltersStore.getState().query).toBe('');
  });
});
