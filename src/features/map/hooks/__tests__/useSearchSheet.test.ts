import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-session-token' }));

const mockSuggest = jest.fn().mockResolvedValue([]);
const mockRetrieve = jest.fn().mockResolvedValue(null);

jest.mock('../../../../services/mapboxSearch', () => ({
  searchMapboxPlaces: jest.fn().mockResolvedValue([]),
  suggestMapboxPlaces: (...args: unknown[]) => mockSuggest(...args),
  retrieveMapboxPlace: (...args: unknown[]) => mockRetrieve(...args),
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
  mockSuggest.mockClear().mockResolvedValue([]);
  mockRetrieve.mockClear().mockResolvedValue(null);
});

// Lets the 300ms debounce fire and the suggest promise settle.
async function settleDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

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

describe('suggestions', () => {
  it('asks Mapbox as the query is typed, with no explicit search action', async () => {
    mockSuggest.mockResolvedValue([{ mapboxId: 'abc', name: 'Blue Bottle' }]);
    const { result } = renderHook(() => useSearchSheet([], getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('blue'));
    await settleDebounce();

    expect(mockSuggest).toHaveBeenCalled();
    expect(result.current.suggestions.map((s) => s.mapboxId)).toEqual(['abc']);
  });

  it('does not call Mapbox below the minimum query length', async () => {
    const { result } = renderHook(() => useSearchSheet([], getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('b'));
    await settleDebounce();

    expect(mockSuggest).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('hides already-loaded suggestions once the query drops below the minimum', async () => {
    mockSuggest.mockResolvedValue([{ mapboxId: 'abc', name: 'Blue Bottle' }]);
    const { result } = renderHook(() => useSearchSheet([], getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('blue'));
    await settleDebounce();
    expect(result.current.suggestions).toHaveLength(1);

    await act(async () => result.current.setQuery('b'));
    await settleDebounce();
    expect(result.current.suggestions).toEqual([]);
  });

  it('reuses one session token across keystrokes, then starts a new one after retrieve', async () => {
    mockSuggest.mockResolvedValue([{ mapboxId: 'abc', name: 'Blue Bottle' }]);
    const { result } = renderHook(() => useSearchSheet([], getMapCenter, getVisibleBbox));

    await act(async () => result.current.setQuery('blue'));
    await settleDebounce();
    await act(async () => result.current.setQuery('blue bo'));
    await settleDebounce();

    const tokens = mockSuggest.mock.calls.map((call) => call[2]);
    expect(new Set(tokens).size).toBe(1);

    await act(async () => {
      await result.current.selectSuggestion({ mapboxId: 'abc', name: 'Blue Bottle' });
    });
    expect(mockRetrieve).toHaveBeenCalledWith('abc', tokens[0]);
  });
});
