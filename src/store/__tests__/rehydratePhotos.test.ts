import AsyncStorage from '@react-native-async-storage/async-storage';

import { usePlacesStore } from '../usePlacesStore';

const STALE_PREFIX =
  'file:///var/mobile/Containers/Data/Application/OLD-UUID/Documents/pinpals-photos/2026-08-26/';

// Photos are copied into Documents, but the stored uri also carries the app's container UUID,
// and iOS issues a new one on every reinstall. Rehydration has to repair that, or every photo
// in the app renders as nothing while the files sit there intact.
describe('places store rehydration', () => {
  it('re-anchors photo paths left behind by a previous install', async () => {
    await AsyncStorage.setItem(
      'pinpals-places',
      JSON.stringify({
        version: 5,
        state: {
          places: [
            {
              id: 'p1',
              name: 'Test',
              coordinates: { latitude: 1, longitude: 1 },
              rating: 0,
              isFavorite: false,
              favorite: false,
              tags: [],
              visitCount: 0,
              createdAt: '2026-08-26T00:00:00.000Z',
              mainPhotoUri: `${STALE_PREFIX}main.jpg`,
            },
          ],
          notes: [
            {
              id: 'n1',
              placeId: 'p1',
              text: '',
              createdAt: '2026-08-26T00:00:00.000Z',
              companions: [],
              photoUri: `${STALE_PREFIX}one.jpg`,
              photoUris: [`${STALE_PREFIX}two.jpg`],
            },
          ],
        },
      }),
    );

    await usePlacesStore.persist.rehydrate();

    const { places, notes } = usePlacesStore.getState();
    expect(places[0].mainPhotoUri).not.toContain('OLD-UUID');
    expect(places[0].mainPhotoUri).toContain('pinpals-photos/2026-08-26/main.jpg');
    expect(notes[0].photoUri).not.toContain('OLD-UUID');
    expect(notes[0].photoUris?.[0]).toContain('pinpals-photos/2026-08-26/two.jpg');
  });
});
