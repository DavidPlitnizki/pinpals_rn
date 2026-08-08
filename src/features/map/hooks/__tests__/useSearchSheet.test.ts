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

const getMapCenter = () => ({ latitude: 0, longitude: 0 });
const getVisibleBbox = async () => undefined;

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: 'p1',
    name: 'Test Cafe',
    coordinates: { latitude: 55.75, longitude: 37.62 },
    category: 'coffee',
    rating: 4,
    isFavorite: false,
    favorite: false,
    tags: [],
    visitCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useSearchFiltersStore.setState({ query: '' });
});

describe('filteredPlaces', () => {
  it('filters own places by name against the debounced query', async () => {
    const places = [
      makePlace({ id: 'coffee-1', name: 'Blue Bottle Coffee' }),
      makePlace({ id: 'food-1', name: 'Pizza Place' }),
    ];
    const { result } = renderHook(() => useSearchSheet(places, getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('coffee'));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 350))); // let debounce settle

    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual(['coffee-1']);
  });

  it('returns every place when the query is empty', () => {
    const places = [makePlace({ id: 'coffee-1' }), makePlace({ id: 'food-1' })];
    const { result } = renderHook(() => useSearchSheet(places, getMapCenter, getVisibleBbox));

    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual(['coffee-1', 'food-1']);
  });
});

describe('resetFilters', () => {
  it('clears the query', async () => {
    const { result } = renderHook(() => useSearchSheet([], getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('sushi'));
    await act(async () => result.current.resetFilters());

    expect(result.current.query).toBe('');
  });
});
