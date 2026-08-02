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

function makeDirectionsResult(
  overrides: Partial<{
    geometry: GeoJSON.LineString;
    distanceMeters: number;
    durationSeconds: number;
    steps: {
      instruction: string;
      distanceMeters: number;
      maneuverLocation: { latitude: number; longitude: number };
    }[];
  }> = {},
) {
  return {
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [1, 1],
        [2, 2],
      ],
    },
    distanceMeters: 400,
    durationSeconds: 200,
    steps: [],
    ...overrides,
  };
}

// openModePicker fires 3 preview requests (walking/driving/cycling) fire-and-forget —
// flush a couple of microtask ticks inside act() so their already-settled mock promises
// resolve/reject and their state updates land before the test proceeds.
async function openPicker(
  result: { current: ReturnType<typeof useRouteDirections> },
  destination: typeof DESTINATION,
  label: string,
) {
  await act(async () => {
    result.current.openModePicker(destination, label);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('closeModePicker (known bug: stale error/loading state)', () => {
  it('clears a failed route from the store so reopening for a new destination has no stale error', async () => {
    mockGetDirections.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.status).toBe('error');

    await act(async () => result.current.closeModePicker());

    expect(result.current.activeRoute).toBeNull();

    // Reopening the picker for a new destination should not show the old error.
    await openPicker(result, { latitude: 1, longitude: 1 }, 'Cafe B');
    expect(result.current.activeRoute).toBeNull();
  });

  it('keeps a successfully-built route intact after closing the picker', async () => {
    mockGetDirections.mockResolvedValue({
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 1],
          [2, 2],
        ],
      },
      distanceMeters: 400,
      durationSeconds: 200,
      steps: [],
    });
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.status).toBe('success');

    await act(async () => result.current.closeModePicker());

    expect(result.current.activeRoute?.status).toBe('success');
    expect(result.current.activeRoute?.geometry).not.toBeNull();
  });

  it('clears a stuck "loading" route (e.g. picker dismissed mid-request) on close', async () => {
    mockGetDirections.mockRejectedValue(new Error('preview fail'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    const { promise } = deferred<{
      geometry: GeoJSON.LineString;
      distanceMeters: number;
      durationSeconds: number;
    }>();
    mockGetDirections.mockReturnValueOnce(promise); // never resolves within this test
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

    await openPicker(result, DESTINATION, 'Cafe A');
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
    const first = deferred<{
      geometry: GeoJSON.LineString;
      distanceMeters: number;
      durationSeconds: number;
    }>();
    const second = {
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [9, 9],
          [10, 10],
        ],
      },
      distanceMeters: 999,
      durationSeconds: 999,
    };

    // Blanket-reject so the 3 preview requests fired by openModePicker never populate
    // the preview cache — confirmRoute below must always fall through to its own fetch.
    mockGetDirections.mockRejectedValue(new Error('preview fail'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    // First request: destination A, kicked off but not yet resolved.
    await openPicker(result, DESTINATION, 'Cafe A');
    mockGetDirections.mockReturnValueOnce(first.promise);
    act(() => {
      void result.current.confirmRoute('walking');
    });
    expect(result.current.activeRoute?.status).toBe('loading');

    // User dismisses and opens a second destination before the first resolves.
    await act(async () => result.current.closeModePicker());
    await openPicker(result, { latitude: 2, longitude: 2 }, 'Cafe B');

    mockGetDirections.mockReturnValueOnce(Promise.resolve(second));
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
    mockGetDirections.mockRejectedValue(new Error('preview fail'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    mockGetDirections.mockReturnValueOnce(first.promise);
    act(() => {
      void result.current.confirmRoute('walking').catch(() => {});
    });

    mockGetDirections.mockReturnValueOnce(
      Promise.resolve({
        geometry: { type: 'LineString', coordinates: [[3, 3]] },
        distanceMeters: 500,
        durationSeconds: 300,
      }),
    );
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

    await openPicker(result, DESTINATION, 'Cafe A');
    await act(async () => result.current.confirmRoute('walking'));

    expect(result.current.activeRoute?.origin).toEqual({
      mode: 'gps',
      coordinates: GPS,
      label: 'Your location',
    });
    mockGetDirections.mock.calls.forEach((call) => expect(call[0]).toEqual(GPS));
  });
});

describe('request cancellation', () => {
  it('aborts a superseded in-flight request', async () => {
    const first = deferred<ReturnType<typeof makeDirectionsResult>>();
    mockGetDirections.mockRejectedValue(new Error('preview fail'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    mockGetDirections.mockReturnValueOnce(first.promise);
    act(() => {
      void result.current.confirmRoute('walking');
    });
    const confirmCalls = mockGetDirections.mock.calls.filter(
      (call) => call[3] instanceof AbortSignal,
    );
    const firstSignal = confirmCalls[confirmCalls.length - 1][3] as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    mockGetDirections.mockReturnValueOnce(Promise.resolve(makeDirectionsResult()));
    await act(async () => result.current.confirmRoute('driving'));

    expect(firstSignal.aborted).toBe(true);
  });

  it('aborts the in-flight request when the route is cleared', async () => {
    const first = deferred<ReturnType<typeof makeDirectionsResult>>();
    mockGetDirections.mockRejectedValue(new Error('preview fail'));
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    mockGetDirections.mockReturnValueOnce(first.promise);
    act(() => {
      void result.current.confirmRoute('walking');
    });
    const confirmCalls = mockGetDirections.mock.calls.filter(
      (call) => call[3] instanceof AbortSignal,
    );
    const signal = confirmCalls[confirmCalls.length - 1][3] as AbortSignal;

    act(() => result.current.clearRoute());

    expect(signal.aborted).toBe(true);
  });
});

describe('route previews', () => {
  it('populates previews for all three profiles after opening the picker', async () => {
    mockGetDirections.mockImplementation(
      (_origin: unknown, _destination: unknown, profile: string) =>
        Promise.resolve(
          makeDirectionsResult({
            distanceMeters: profile === 'walking' ? 100 : profile === 'driving' ? 200 : 300,
          }),
        ),
    );
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    expect(result.current.previews.walking).toEqual({
      status: 'success',
      distanceMeters: 100,
      durationSeconds: 200,
    });
    expect(result.current.previews.driving).toEqual({
      status: 'success',
      distanceMeters: 200,
      durationSeconds: 200,
    });
    expect(result.current.previews.cycling).toEqual({
      status: 'success',
      distanceMeters: 300,
      durationSeconds: 200,
    });
  });

  it('does not let one failed profile block the other two', async () => {
    mockGetDirections.mockImplementation(
      (_origin: unknown, _destination: unknown, profile: string) =>
        profile === 'driving'
          ? Promise.reject(new Error('boom'))
          : Promise.resolve(makeDirectionsResult()),
    );
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');

    expect(result.current.previews.driving?.status).toBe('error');
    expect(result.current.previews.walking?.status).toBe('success');
    expect(result.current.previews.cycling?.status).toBe('success');
  });

  it('reuses a cached preview on confirm instead of calling getDirections again', async () => {
    mockGetDirections.mockResolvedValue(
      makeDirectionsResult({ distanceMeters: 123, durationSeconds: 456 }),
    );
    const { result } = renderHook(() => useRouteDirections(GPS));

    await openPicker(result, DESTINATION, 'Cafe A');
    expect(mockGetDirections).toHaveBeenCalledTimes(3);

    await act(async () => result.current.confirmRoute('walking'));

    expect(mockGetDirections).toHaveBeenCalledTimes(3); // no extra network call
    expect(result.current.activeRoute?.status).toBe('success');
    expect(result.current.activeRoute?.distanceMeters).toBe(123);
  });

  it('does not let a stale preview batch overwrite a newer one', async () => {
    const slow = deferred<ReturnType<typeof makeDirectionsResult>>();
    mockGetDirections.mockImplementationOnce(() => slow.promise); // Cafe A's walking preview
    mockGetDirections.mockResolvedValue(makeDirectionsResult({ distanceMeters: 111 }));
    const { result } = renderHook(() => useRouteDirections(GPS));

    act(() => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await openPicker(result, { latitude: 2, longitude: 2 }, 'Cafe B');

    expect(result.current.previews.walking?.distanceMeters).toBe(111);

    await act(async () => {
      slow.resolve(makeDirectionsResult({ distanceMeters: 999 }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.previews.walking?.distanceMeters).toBe(111);
  });
});
