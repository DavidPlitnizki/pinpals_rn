import { renderHook, act } from '@testing-library/react-native';

// ─── mocks ─────────────────────────────────────────────────────────────────

const mockAddPlace = jest.fn(() => 'place-1');
const mockAddNote = jest.fn();
const mockDeletePlace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('../../../../store/usePlacesStore', () => {
  // Built lazily on each call: jest.mock is hoisted above the mockXxx declarations, so
  // capturing them at factory time would capture undefined.
  const getState = () => ({
    places: [],
    addPlace: mockAddPlace,
    deletePlace: mockDeletePlace,
    addNote: mockAddNote,
  });
  // The hook reads the store both as a hook and imperatively (getState) — the location
  // fallback needs the saved places without subscribing to them. Selector-aware, because the
  // hook subscribes field by field rather than pulling the whole store.
  const usePlacesStore = (selector?: (state: ReturnType<typeof getState>) => unknown) =>
    selector ? selector(getState()) : getState();
  usePlacesStore.getState = getState;
  return { usePlacesStore };
});

// Real photo copying touches the native expo-file-system module, which isn't available in
// the Jest environment — pass uris through unchanged so save-flow assertions can focus on
// the place/note data instead.
jest.mock('../../../../shared/photoStorage', () => ({
  copyPhotosToAppStorage: jest.fn((uris: string[]) => Promise.resolve(uris)),
}));

jest.mock('../../../../store/useProfileStore', () => {
  const state = { profile: { name: 'Test User' } };
  return {
    useProfileStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

// Reverse lookups are what a long press waits on, so the tests have to decide when they
// answer. Defaults to "nothing found", which is also what the real thing does without a token.
const mockReverseGeocodePoi = jest.fn(() => Promise.resolve(null));
const mockReverseGeocodeAddress = jest.fn(() => Promise.resolve(null));
jest.mock('../../../../services/mapboxSearch', () => ({
  reverseGeocodePoi: (...args: unknown[]) => mockReverseGeocodePoi(...(args as [])),
  reverseGeocodeAddress: (...args: unknown[]) => mockReverseGeocodeAddress(...(args as [])),
}));

// eslint-disable-next-line import/first
import { useMapScreen } from '../useMapScreen';

// The real screenPointX/screenPointY are typed as always-present numbers, but
// handleMapPress defensively guards against null/undefined at runtime (Mapbox's
// actual payload isn't guaranteed to match the TS type) — cast to exercise that guard.
const SCREEN_POINT_FEATURE = (x: number | null, y: number | null) =>
  ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [37.62, 55.75] as [number, number] },
    properties: { screenPointX: x, screenPointY: y },
  }) as unknown as Parameters<ReturnType<typeof useMapScreen>['handleMapPress']>[0];

function makeCollection(features: unknown[]) {
  return { type: 'FeatureCollection', features };
}

beforeEach(() => {
  mockAddPlace.mockClear();
  mockAddNote.mockClear();
  mockDeletePlace.mockClear();
  mockReverseGeocodePoi.mockReset().mockResolvedValue(null);
  mockReverseGeocodeAddress.mockReset().mockResolvedValue(null);
  // useMapScreen's mount-time requestLocation() always ends in showToast(), which
  // schedules a 2.5s Animated.delay — fake timers keep that from leaking past each test.
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('handleMapPress', () => {
  it('does nothing when screenPointX/Y are missing', async () => {
    const { result } = renderHook(() => useMapScreen());
    await act(async () => {
      await result.current.handleMapPress(SCREEN_POINT_FEATURE(null, null));
    });
    expect(result.current.nativePoiMarker).toBeNull();
  });

  it('does not throw and sets no marker when mapViewRef.current is null (first-frame tap)', async () => {
    const { result } = renderHook(() => useMapScreen());
    expect(result.current.mapViewRef.current).toBeNull();

    await act(async () => {
      await expect(
        result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200)),
      ).resolves.toBeUndefined();
    });
    expect(result.current.nativePoiMarker).toBeNull();
  });

  it('does not throw when queryRenderedFeaturesAtPoint rejects (no unhandled rejection)', async () => {
    const { result } = renderHook(() => useMapScreen());
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest.fn().mockRejectedValue(new Error('native error')),
    };

    await act(async () => {
      await expect(
        result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200)),
      ).resolves.toBeUndefined();
    });
    expect(result.current.nativePoiMarker).toBeNull();
  });

  it('sets no marker when no rendered feature has a name', async () => {
    const { result } = renderHook(() => useMapScreen());
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest
        .fn()
        .mockResolvedValue(
          makeCollection([{ properties: {}, geometry: { type: 'Point', coordinates: [1, 2] } }]),
        ),
    };

    await act(async () => {
      await result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200));
    });
    expect(result.current.nativePoiMarker).toBeNull();
  });

  it('sets a native POI marker from a named Point feature', async () => {
    const { result } = renderHook(() => useMapScreen());
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest.fn().mockResolvedValue(
        makeCollection([
          {
            properties: { name: 'Central Park', maki: 'park', class: 'park' },
            geometry: { type: 'Point', coordinates: [37.63, 55.76] },
          },
        ]),
      ),
    };

    await act(async () => {
      await result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200));
    });

    expect(result.current.nativePoiMarker).toMatchObject({
      name: 'Central Park',
      maki: 'park',
      category: 'park',
      coordinates: { latitude: 55.76, longitude: 37.63 },
    });
  });

  it('falls back to the tap coordinates when the POI feature has non-Point geometry', async () => {
    const { result } = renderHook(() => useMapScreen());
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest.fn().mockResolvedValue(
        makeCollection([
          {
            properties: { name: 'Some Area' },
            geometry: { type: 'Polygon', coordinates: [[[0, 0]]] },
          },
        ]),
      ),
    };

    await act(async () => {
      await result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200));
    });

    expect(result.current.nativePoiMarker).toMatchObject({
      name: 'Some Area',
      coordinates: { latitude: 55.75, longitude: 37.62 }, // from the original tap feature
    });
  });

  it('does not resurrect a native POI marker if a real annotation tap lands while the query is in flight', async () => {
    const { result } = renderHook(() => useMapScreen());
    let resolveQuery!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveQuery = resolve;
    });
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest.fn().mockReturnValue(pending),
    };

    let pressPromise!: Promise<void>;
    act(() => {
      pressPromise = result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200));
    });

    // A fast follow-up tap on one of our own markers fires while the native query
    // for the earlier empty-map tap is still in flight.
    act(() => {
      result.current.markAnnotationTapped();
    });

    await act(async () => {
      resolveQuery(
        makeCollection([
          {
            properties: { name: 'Central Park' },
            geometry: { type: 'Point', coordinates: [37.63, 55.76] },
          },
        ]),
      );
      await pressPromise;
    });

    expect(result.current.nativePoiMarker).toBeNull();
  });
});

describe('add-place sheet', () => {
  it("opens from a native-POI confirm, seeded with that POI's coordinates", () => {
    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Another Place',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });

    expect(result.current.showQuickAddSheet).toBe(true);
    expect(result.current.pendingPlaceCoords).toEqual({ latitude: 3, longitude: 4 });
    expect(result.current.nativePoiMarker).toBeNull();
  });

  it('closing without saving clears the pending coordinates too', () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Rooftop',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });
    act(() => {
      result.current.handleCloseQuickAddSheet();
    });
    expect(result.current.showQuickAddSheet).toBe(false);
    expect(result.current.pendingPlaceCoords).toBeNull();
  });
});

describe('handleLongPress', () => {
  it('opens the three-action card instead of the save form', async () => {
    const { result } = renderHook(() => useMapScreen());

    await act(async () => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });

    // The choice between web search, directions and saving belongs to the user — dropping
    // straight into the form took it away, with no route back except cancelling.
    expect(result.current.showQuickAddSheet).toBe(false);
    expect(result.current.nativePoiMarker).not.toBeNull();
  });

  it('names the point by its address when the basemap knows no venue there', async () => {
    const { result } = renderHook(() => useMapScreen());

    await act(async () => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });

    // No Mapbox token in tests, so both lookups resolve null — the card must still open,
    // labelled, rather than showing bare coordinates or nothing at all.
    expect(result.current.nativePoiMarker?.name).toBe('Dropped pin');
    expect(result.current.nativePoiMarker?.coordinates).toEqual({ latitude: 3, longitude: 4 });
  });

  it('puts the card on screen before the lookup answers', () => {
    // Two network round trips separate the press from a name. Waiting them out before
    // showing anything made a long press look like it had been ignored.
    let resolvePoi: (value: null) => void = () => {};
    mockReverseGeocodePoi.mockReturnValue(new Promise((resolve) => (resolvePoi = resolve)));

    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });

    expect(result.current.nativePoiMarker?.pending).toBe(true);
    expect(result.current.nativePoiMarker?.coordinates).toEqual({ latitude: 3, longitude: 4 });
    // Nothing to look up a second time: the card must not go shopping for details of a point
    // that has not been identified yet.
    expect(result.current.nativePoiMarker?.resolvedDetails).toEqual({});

    resolvePoi(null);
  });

  it('carries the venue phone and website the POI lookup already paid for', async () => {
    mockReverseGeocodePoi.mockResolvedValue({
      name: 'Blue Bottle',
      address: '1 Ferry Building',
      phone: '+14155551234',
      website: 'https://bluebottlecoffee.com',
      coordinates: { latitude: 3.001, longitude: 4.001 },
      distanceMeters: 12,
    } as never);

    const { result } = renderHook(() => useMapScreen());

    await act(async () => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });

    expect(result.current.nativePoiMarker?.name).toBe('Blue Bottle');
    // The Search Box answer holds all three. Dropping them here would make the callout buy
    // the same facts again from a second billed endpoint.
    expect(result.current.nativePoiMarker?.resolvedDetails).toEqual({
      address: '1 Ferry Building',
      phone: '+14155551234',
      website: 'https://bluebottlecoffee.com',
    });
    expect(result.current.nativePoiMarker?.pending).toBeUndefined();
  });

  it('does not let a stale lookup replace the card a later tap opened', async () => {
    let resolvePoi: (value: null) => void = () => {};
    mockReverseGeocodePoi.mockReturnValue(new Promise((resolve) => (resolvePoi = resolve)));

    const { result } = renderHook(() => useMapScreen());
    (result.current.mapViewRef as { current: unknown }).current = {
      queryRenderedFeaturesAtPoint: jest.fn().mockResolvedValue(
        makeCollection([
          {
            properties: { name: 'Central Park' },
            geometry: { type: 'Point', coordinates: [37.63, 55.76] },
          },
        ]),
      ),
    };

    act(() => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });
    await act(async () => {
      await result.current.handleMapPress(SCREEN_POINT_FEATURE(100, 200));
    });
    expect(result.current.nativePoiMarker?.name).toBe('Central Park');

    // The long press the user abandoned finally answers. The tap after it decided what is on
    // screen; letting this land would swap the card out from under them seconds later.
    await act(async () => {
      resolvePoi(null);
    });

    expect(result.current.nativePoiMarker?.name).toBe('Central Park');
  });

  it('stops the request itself, not just its answer, when the card is dismissed', async () => {
    let signal: AbortSignal | undefined;
    mockReverseGeocodePoi.mockImplementation(((_coords: unknown, received: AbortSignal) => {
      signal = received;
      return new Promise(() => {});
    }) as never);

    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });
    expect(signal?.aborted).toBe(false);

    act(() => {
      result.current.handleCloseNativePoiMarker();
    });

    // Ignoring the answer is enough for correctness; aborting is what keeps a lookup nobody
    // is waiting for from holding a connection open behind the user.
    expect(signal?.aborted).toBe(true);
  });

  it('does not reopen a card the user has already dismissed', async () => {
    let resolvePoi: (value: null) => void = () => {};
    mockReverseGeocodePoi.mockReturnValue(new Promise((resolve) => (resolvePoi = resolve)));

    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleLongPress({ geometry: { coordinates: [4, 3] } });
    });
    act(() => {
      result.current.handleCloseNativePoiMarker();
    });

    // The slow answer lands after the card is gone. It belongs to a point the user has
    // walked away from, so it must not put the card back.
    await act(async () => {
      resolvePoi(null);
    });

    expect(result.current.nativePoiMarker).toBeNull();
  });
});

describe('handleSaveQuickAddPlace', () => {
  it('creates a place + note at the pending coordinates and closes the sheet', async () => {
    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Original Name',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });

    await act(async () => {
      await result.current.handleSaveQuickAddPlace({
        name: 'New Spot',
        description: 'Great place',
        photoUris: ['file://photo.jpg'],
        mood: 'happy',
        rating: 4,
        favorite: false,
        wantToVisit: false,
        tags: ['coffee'],
      });
    });

    expect(mockAddPlace).toHaveBeenCalledTimes(1);
    expect(mockAddPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Spot',
        description: 'Great place',
        coordinates: { latitude: 3, longitude: 4 },
        rating: 4,
        tags: ['coffee'],
      }),
    );
    expect(mockAddNote).toHaveBeenCalledTimes(1);
    expect(result.current.showQuickAddSheet).toBe(false);
    expect(result.current.pendingPlaceCoords).toBeNull();
  });

  it('saves a composed memory as the place note, with its companions', async () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Rooftop',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });

    await act(async () => {
      await result.current.handleSaveQuickAddPlace({
        name: 'Rooftop',
        description: 'Nice view',
        photoUris: [],
        rating: 5,
        favorite: false,
        wantToVisit: false,
        tags: [],
        memory: {
          text: 'Watched the sunset',
          photoUris: ['file://sunset.jpg'],
          mood: 'calm',
          companions: ['Anna'],
        },
      });
    });

    expect(mockAddNote).toHaveBeenCalledTimes(1);
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Watched the sunset',
        mood: 'calm',
        companions: ['Anna'],
        photoUris: ['file://sunset.jpg'],
      }),
    );
  });

  it('writes nothing at all when the sheet is closed instead of saved', () => {
    // The memory only ever lives in the sheet's own state, so backing out has to leave no
    // trace — no place, and no orphaned note pointing at a place that was never created.
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Rooftop',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });

    act(() => {
      result.current.handleCloseQuickAddSheet();
    });

    expect(mockAddPlace).not.toHaveBeenCalled();
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it('falls back to "New Pin" when the name is left blank', async () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Rooftop',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });
    await act(async () => {
      await result.current.handleSaveQuickAddPlace({
        name: '   ',
        description: '',
        photoUris: [],
        rating: 5,
        favorite: false,
        wantToVisit: false,
        tags: [],
      });
    });
    expect(mockAddPlace).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Pin' }));
  });

  it('does nothing when there are no pending coordinates', async () => {
    const { result } = renderHook(() => useMapScreen());
    await act(async () => {
      await result.current.handleSaveQuickAddPlace({
        name: 'New Spot',
        description: '',
        photoUris: [],
        rating: 5,
        favorite: false,
        wantToVisit: false,
        tags: [],
      });
    });
    expect(mockAddPlace).not.toHaveBeenCalled();
  });
});
