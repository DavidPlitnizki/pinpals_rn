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

jest.mock('../../../../store/usePlacesStore', () => ({
  usePlacesStore: () => ({
    places: [],
    addPlace: mockAddPlace,
    deletePlace: mockDeletePlace,
    addNote: mockAddNote,
  }),
}));

jest.mock('../../../../store/useProfileStore', () => ({
  useProfileStore: () => ({ profile: { name: 'Test User' } }),
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

  it('opens from the "+" button with coordinates seeded from GPS or the map centre', () => {
    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleAddAtCurrentLocation();
    });

    expect(result.current.showQuickAddSheet).toBe(true);
    // Never left null, otherwise the preview pin would have nothing to render at.
    expect(result.current.pendingPlaceCoords).not.toBeNull();
  });

  it('closing without saving clears the pending coordinates too', () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleAddAtCurrentLocation();
    });
    act(() => {
      result.current.handleCloseQuickAddSheet();
    });
    expect(result.current.showQuickAddSheet).toBe(false);
    expect(result.current.pendingPlaceCoords).toBeNull();
  });
});

describe('handleSaveQuickAddPlace', () => {
  it('creates a place + note at the pending coordinates and closes the sheet', () => {
    const { result } = renderHook(() => useMapScreen());

    act(() => {
      result.current.handleConfirmNativePoiMarker({
        id: 'poi-1',
        name: 'Original Name',
        coordinates: { latitude: 3, longitude: 4 },
      });
    });

    act(() => {
      result.current.handleSaveQuickAddPlace({
        name: 'New Spot',
        description: 'Great place',
        photoUris: ['file://photo.jpg'],
        mood: 'happy',
        rating: 4,
      });
    });

    expect(mockAddPlace).toHaveBeenCalledTimes(1);
    expect(mockAddPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Spot',
        description: 'Great place',
        coordinates: { latitude: 3, longitude: 4 },
        rating: 4,
      }),
    );
    expect(mockAddNote).toHaveBeenCalledTimes(1);
    expect(result.current.showQuickAddSheet).toBe(false);
    expect(result.current.pendingPlaceCoords).toBeNull();
  });

  it('falls back to "New Pin" when the name is left blank', () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleAddAtCurrentLocation();
    });
    act(() => {
      result.current.handleSaveQuickAddPlace({
        name: '   ',
        description: '',
        photoUris: [],
        rating: 5,
      });
    });
    expect(mockAddPlace).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Pin' }));
  });

  it('does nothing when there are no pending coordinates', () => {
    const { result } = renderHook(() => useMapScreen());
    act(() => {
      result.current.handleSaveQuickAddPlace({
        name: 'New Spot',
        description: '',
        photoUris: [],
        rating: 5,
      });
    });
    expect(mockAddPlace).not.toHaveBeenCalled();
  });
});
