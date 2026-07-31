import { renderHook, act } from '@testing-library/react-native';

const mockGetDirections = jest.fn();
jest.mock('../../../../services/directions', () => ({
  getDirections: (...args: unknown[]) => mockGetDirections(...args),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const mockRemove = jest.fn();
let watchPositionDeferred: ReturnType<typeof deferred<{ remove: jest.Mock }>>;
const mockWatchPositionAsync = jest.fn(() => watchPositionDeferred.promise);

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 'balanced' },
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...(args as [])),
}));

let appStateListener: ((state: string) => void) | null = null;
const mockAppStateRemove = jest.fn();

// eslint-disable-next-line import/first
import { AppState } from 'react-native';
// eslint-disable-next-line import/first
import { useRouteDirections } from '../useRouteDirections';
// eslint-disable-next-line import/first
import { useRouteStore } from '../../../../store/useRouteStore';

jest.spyOn(AppState, 'addEventListener').mockImplementation(((_event: string, cb: (state: string) => void) => {
  appStateListener = cb;
  return { remove: mockAppStateRemove };
}) as typeof AppState.addEventListener);
Object.defineProperty(AppState, 'currentState', { value: 'active', writable: true, configurable: true });

const GPS = { latitude: 55.75, longitude: 37.62 };
const DESTINATION = { latitude: 55.76, longitude: 37.64 };

function makeDirectionsResult() {
  return {
    geometry: { type: 'LineString' as const, coordinates: [[1, 1], [2, 2]] },
    distanceMeters: 400,
    durationSeconds: 200,
    steps: [],
  };
}

beforeEach(() => {
  useRouteStore.setState({ activeRoute: null });
  mockGetDirections.mockReset();
  mockWatchPositionAsync.mockClear();
  mockRemove.mockReset();
  mockAppStateRemove.mockReset();
  appStateListener = null;
  watchPositionDeferred = deferred();
});

async function buildSuccessfulGpsRoute() {
  mockGetDirections.mockResolvedValue(makeDirectionsResult());
  const { result, unmount, rerender } = renderHook(
    ({ granted }: { granted: boolean }) => useRouteDirections(GPS, granted),
    { initialProps: { granted: true } },
  );
  await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
  await act(async () => result.current.confirmRoute('walking'));
  expect(result.current.activeRoute?.status).toBe('success');
  return { result, unmount, rerender };
}

describe('live tracking effect', () => {
  it('removes the location subscription immediately if cleanup ran while watchPositionAsync was still resolving', async () => {
    const { unmount } = await buildSuccessfulGpsRoute();

    // watchPositionAsync has been kicked off but its promise has not resolved yet.
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);

    // Cleanup runs (e.g. unmount) before the native call finishes setting up.
    unmount();

    // The native call finally resolves *after* cleanup already ran.
    await act(async () => {
      watchPositionDeferred.resolve({ remove: mockRemove });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Without the fix this subscription would never be removed — a leaked
    // watchPositionAsync subscription that keeps firing forever.
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('removes both the location watcher and the AppState listener on unmount once tracking has started', async () => {
    const { unmount } = await buildSuccessfulGpsRoute();

    await act(async () => {
      watchPositionDeferred.resolve({ remove: mockRemove });
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAppStateRemove).toHaveBeenCalledTimes(1);
  });

  it('stops the watcher on background and restarts (without re-adding a listener) on foreground', async () => {
    await buildSuccessfulGpsRoute();

    await act(async () => {
      watchPositionDeferred.resolve({ remove: mockRemove });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(appStateListener).not.toBeNull();

    // App backgrounds: the watcher should stop, but the AppState listener stays registered.
    act(() => appStateListener!('background'));
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAppStateRemove).not.toHaveBeenCalled();

    // App foregrounds again: a fresh watch is requested.
    watchPositionDeferred = deferred();
    await act(async () => {
      appStateListener!('active');
      await Promise.resolve();
    });
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(2);
  });

  it('does not start tracking when locationGranted is false', async () => {
    mockGetDirections.mockResolvedValue(makeDirectionsResult());
    const { result } = renderHook(() => useRouteDirections(GPS, false));
    await act(async () => result.current.openModePicker(DESTINATION, 'Cafe A'));
    await act(async () => result.current.confirmRoute('walking'));

    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });
});
