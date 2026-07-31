import { renderHook, act } from '@testing-library/react-native';

const mockGetDirections = jest.fn();
jest.mock('../../../../services/directions', () => ({
  getDirections: (...args: unknown[]) => mockGetDirections(...args),
}));

// eslint-disable-next-line import/first
import { useRouteDirections } from '../useRouteDirections';
// eslint-disable-next-line import/first
import { useRouteStore } from '../../../../store/useRouteStore';

const GPS = { latitude: 55.75, longitude: 37.62 };
const DESTINATION = { latitude: 55.76, longitude: 37.64 };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  useRouteStore.setState({ activeRoute: null });
  mockGetDirections.mockReset();
});

function makeDirectionsResult(overrides: Partial<{
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  steps: { instruction: string; distanceMeters: number; maneuverLocation: { latitude: number; longitude: number } }[];
}> = {}) {
  return {
    geometry: { type: 'LineString' as const, coordinates: [[1, 1], [2, 2]] },
    distanceMeters: 400,
    durationSeconds: 200,
    steps: [],
    ...overrides,
  };
}

describe('closeModePicker (known bug: stale error/loading state)', () => {
  it('clears a failed route from the store so reopening for a new destination has no stale error', async () => {
    mockGetDirections.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.status).toBe('error');

    await act(async () => result.current.closeModePicker());

    expect(result.current.activeRoute).toBeNull();

    // Reopening the picker for a new destination should not show the old error.
    await act(async () => result.current.openModePicker({ latitude: 1, longitude: 1 }, 'Cafe B'));
    expect(result.current.activeRoute).toBeNull();
  });

  it('keeps a successfully-built route intact after closing the picker', async () => {
    mockGetDirections.mockResolvedValue({
      geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] },
      distanceMeters: 400,
      durationSeconds: 200,
    });
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.status).toBe('success');

    await act(async () => result.current.closeModePicker());

    expect(result.current.activeRoute?.status).toBe('success');
    expect(result.current.activeRoute?.geometry).not.toBeNull();
  });

  it('clears a stuck "loading" route (e.g. picker dismissed mid-request) on close', async () => {
    const { promise } = deferred<{ geometry: GeoJSON.LineString; distanceMeters: number; durationSeconds: number }>();
    mockGetDirections.mockReturnValue(promise); // never resolves within this test
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => {
      void result.current.confirmRoute('walking');
    });

    expect(result.current.activeRoute?.status).toBe('loading');

    await act(async () => result.current.closeModePicker());

    expect(result.current.activeRoute).toBeNull();
  });
});

describe('confirmRoute edge cases', () => {
  it('does nothing when gpsCoords is null (no location)', async () => {
    const { result } = renderHook(() => useRouteDirections(null));
    expect(result.current.hasLocation).toBe(false);

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await act(async () => result.current.confirmRoute('walking'));

    expect(mockGetDirections).not.toHaveBeenCalled();
    expect(result.current.activeRoute).toBeNull();
  });

  it('does nothing when there is no pending destination', async () => {
    const { result } = renderHook(() => useRouteDirections(GPS));
    await act(async () => result.current.confirmRoute('walking'));
    expect(mockGetDirections).not.toHaveBeenCalled();
  });
});

describe('race conditions', () => {
  it('a stale in-flight request does not overwrite a newer successful route', async () => {
    const first = deferred<{ geometry: GeoJSON.LineString; distanceMeters: number; durationSeconds: number }>();
    const second = {
      geometry: { type: 'LineString' as const, coordinates: [[9, 9], [10, 10]] },
      distanceMeters: 999,
      durationSeconds: 999,
    };

    mockGetDirections.mockReturnValueOnce(first.promise);
    const { result } = renderHook(() => useRouteDirections(GPS));

    // First request: destination A, kicked off but not yet resolved.
    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => {
      void result.current.confirmRoute('walking');
    });
    expect(result.current.activeRoute?.status).toBe('loading');

    // User dismisses and opens a second destination before the first resolves.
    await act(async () => result.current.closeModePicker());
    await act(async () => result.current.openModePicker({ latitude: 2, longitude: 2 }, 'Cafe B'));

    mockGetDirections.mockResolvedValueOnce(second);
    await act(async () => result.current.confirmRoute('driving'));

    expect(result.current.activeRoute?.destinationLabel).toBe('Cafe B');
    expect(result.current.activeRoute?.distanceMeters).toBe(999);

    // The stale first request now resolves — it must NOT clobber the newer route.
    await act(async () => {
      first.resolve({
        geometry: { type: 'LineString', coordinates: [[0, 0]] },
        distanceMeters: 111,
        durationSeconds: 111,
      });
      await Promise.resolve();
    });

    expect(result.current.activeRoute?.destinationLabel).toBe('Cafe B');
    expect(result.current.activeRoute?.distanceMeters).toBe(999);
  });

  it('a stale in-flight error does not overwrite a newer successful route', async () => {
    const first = deferred<never>();
    mockGetDirections.mockReturnValueOnce(first.promise);
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => {
      void result.current.confirmRoute('walking').catch(() => {});
    });

    mockGetDirections.mockResolvedValueOnce({
      geometry: { type: 'LineString', coordinates: [[3, 3]] },
      distanceMeters: 500,
      durationSeconds: 300,
    });
    await act(async () => result.current.confirmRoute('walking'));
    expect(result.current.activeRoute?.status).toBe('success');

    await act(async () => {
      first.reject(new Error('stale failure'));
      await Promise.resolve().then(() => Promise.resolve());
    });

    expect(result.current.activeRoute?.status).toBe('success');
  });
});

describe('origin selection', () => {
  it('defaults to gps origin and resolves it from gpsCoords on confirm', async () => {
    mockGetDirections.mockResolvedValue(makeDirectionsResult());
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.origin).toEqual({ mode: 'gps', coordinates: GPS, label: 'Your location' });
    expect(mockGetDirections.mock.calls[0][0]).toEqual(GPS);
  });

  it('resolves a place origin picked via selectOriginPlace', async () => {
    mockGetDirections.mockResolvedValue(makeDirectionsResult());
    const { result } = renderHook(() => useRouteDirections(GPS));
    const placeCoords = { latitude: 10, longitude: 10 };

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => result.current.selectOriginPlace(placeCoords, 'Home'));
    expect(result.current.originMode).toBe('place');
    expect(result.current.placePickerVisible).toBe(false);

    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.origin).toEqual({ mode: 'place', coordinates: placeCoords, label: 'Home' });
    expect(mockGetDirections.mock.calls[0][0]).toEqual(placeCoords);
  });

  it('does nothing on confirm when place mode is selected but no place was chosen', async () => {
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => result.current.openPlacePicker());
    await act(async () => result.current.confirmRoute('walking'));

    expect(mockGetDirections).not.toHaveBeenCalled();
    expect(result.current.activeRoute).toBeNull();
  });
});

describe('request cancellation', () => {
  it('aborts a superseded in-flight request', async () => {
    const first = deferred<ReturnType<typeof makeDirectionsResult>>();
    mockGetDirections.mockReturnValueOnce(first.promise);
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => {
      void result.current.confirmRoute('walking');
    });
    const firstSignal = mockGetDirections.mock.calls[0][3] as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    mockGetDirections.mockResolvedValueOnce(makeDirectionsResult());
    await act(async () => result.current.confirmRoute('driving'));

    expect(firstSignal.aborted).toBe(true);
  });

  it('aborts the in-flight request when the route is cleared', async () => {
    const first = deferred<ReturnType<typeof makeDirectionsResult>>();
    mockGetDirections.mockReturnValueOnce(first.promise);
    const { result } = renderHook(() => useRouteDirections(GPS));

    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    act(() => {
      void result.current.confirmRoute('walking');
    });
    const signal = mockGetDirections.mock.calls[0][3] as AbortSignal;

    act(() => result.current.clearRoute());

    expect(signal.aborted).toBe(true);
  });
});
