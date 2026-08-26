import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearLocalUserData } from '../clearLocalUserData';
import { usePlacesStore } from '../usePlacesStore';
import { DEFAULT_PROFILE_NAME, useProfileStore } from '../useProfileStore';
import { useRouteStore } from '../useRouteStore';
import { useMapStyleStore } from '../useMapStyleStore';
import { useSearchFiltersStore } from '../useSearchFiltersStore';

const place = {
  id: 'p1',
  name: 'Test Cafe',
  coordinates: { latitude: 55.75, longitude: 37.62 },
  category: 'coffee' as const,
  rating: 4,
  isFavorite: false,
  favorite: false,
  tags: [],
  visitCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('clearLocalUserData', () => {
  it('removes every trace of the account from the device', () => {
    usePlacesStore.setState({ places: [place], notes: [] });
    useProfileStore.setState({ profile: { id: '1', name: 'Ada', avatarUri: 'file:///a.jpg' } });
    useSearchFiltersStore.setState({ query: 'sushi' });
    useMapStyleStore.setState({ styleId: 'satellite' });
    useRouteStore.setState({
      activeRoute: {
        status: 'success',
        origin: { mode: 'gps', coordinates: { latitude: 1, longitude: 1 }, label: 'You' },
        waypoints: [{ coordinates: { latitude: 2, longitude: 2 }, label: 'Somewhere private' }],
        profile: 'walking',
        geometry: null,
        distanceMeters: 100,
        durationSeconds: 100,
        steps: [],
        error: null,
      } as never,
    });

    clearLocalUserData();

    expect(usePlacesStore.getState().places).toEqual([]);
    expect(usePlacesStore.getState().notes).toEqual([]);
    expect(useProfileStore.getState().profile).toEqual({ id: '1', name: DEFAULT_PROFILE_NAME });
    expect(useSearchFiltersStore.getState().query).toBe('');
    expect(useMapStyleStore.getState().styleId).toBe('streets');
    expect(useRouteStore.getState().activeRoute).toBeNull();
  });
});
