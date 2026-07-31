import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../../../services/mapboxSearch', () => ({
  searchMapboxPlaces: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import { useSearchSheet } from '../useSearchSheet';
// eslint-disable-next-line import/first
import { useSearchFiltersStore } from '../../../../store/useSearchFiltersStore';
// eslint-disable-next-line import/first
import { Place } from '../../../../models/types';
// eslint-disable-next-line import/first
import { DEFAULT_RADIUS_M } from '../../constants';

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: 'p1',
    name: 'Test Cafe',
    coordinates: { latitude: 55.75, longitude: 37.62 },
    category: 'coffee',
    rating: 4,
    isFavorite: false,
    tags: [],
    visitCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

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

describe('activeCategories / specialFilters Set round-trip', () => {
  it('toggleCategory persists as an array and is exposed as a working Set', async () => {
    const places = [makePlace({ id: 'coffee-1', category: 'coffee' }), makePlace({ id: 'food-1', category: 'food' })];
    const { result } = renderHook(() => useSearchSheet(places, null));

    await act(async () => result.current.toggleCategory('coffee'));

    expect(result.current.activeCategories).toBeInstanceOf(Set);
    expect(result.current.activeCategories.has('coffee')).toBe(true);
    expect(useSearchFiltersStore.getState().activeCategories).toEqual(['coffee']);
    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual(['coffee-1']);
  });

  it('rehydrated array-backed categories filter places correctly (round-trip)', async () => {
    // Simulate a value already persisted from a previous session.
    await AsyncStorage.setItem(
      'pinpals-search-filters',
      JSON.stringify({
        state: {
          query: '',
          activeCategories: ['food'],
          specialFilters: [],
          radiusM: DEFAULT_RADIUS_M,
          radiusEnabled: true,
          alwaysShowFavorites: true,
        },
        version: 0,
      }),
    );
    await useSearchFiltersStore.persist.rehydrate();

    const places = [makePlace({ id: 'coffee-1', category: 'coffee' }), makePlace({ id: 'food-1', category: 'food' })];
    const { result } = renderHook(() => useSearchSheet(places, null));

    expect(result.current.activeCategories.has('food')).toBe(true);
    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual(['food-1']);
  });

  it('toggleSpecial adds and removes a filter from the Set/array', async () => {
    const { result } = renderHook(() => useSearchSheet([], null));

    await act(async () => result.current.toggleSpecial('favorites'));
    expect(result.current.specialFilters.has('favorites')).toBe(true);
    expect(useSearchFiltersStore.getState().specialFilters).toEqual(['favorites']);

    await act(async () => result.current.toggleSpecial('favorites'));
    expect(result.current.specialFilters.has('favorites')).toBe(false);
    expect(useSearchFiltersStore.getState().specialFilters).toEqual([]);
  });
});

describe('resetFilters', () => {
  it('clears query, categories, special filters, and radius but keeps alwaysShowFavorites', async () => {
    const { result } = renderHook(() => useSearchSheet([], null));

    await act(async () => result.current.setQuery('sushi'));
    await act(async () => result.current.toggleCategory('food'));
    await act(async () => result.current.toggleSpecial('favorites'));
    await act(async () => result.current.setAlwaysShowFavorites(false));

    await act(async () => result.current.resetFilters());

    expect(result.current.query).toBe('');
    expect(result.current.activeCategories.size).toBe(0);
    expect(result.current.specialFilters.size).toBe(0);
    expect(result.current.alwaysShowFavorites).toBe(false); // preference, not reset
  });
});
