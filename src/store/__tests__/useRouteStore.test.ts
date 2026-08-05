import { useRouteStore } from '../useRouteStore';
import { ActiveRoute } from '../../features/map/types';

// Reset store before each test
beforeEach(() => {
  useRouteStore.setState({ activeRoute: null });
});

function makeRoute(overrides: Partial<ActiveRoute> = {}): ActiveRoute {
  return {
    profile: 'walking',
    origin: { mode: 'gps', coordinates: { latitude: 1, longitude: 1 }, label: 'Your location' },
    waypoints: [{ coordinates: { latitude: 2, longitude: 2 }, label: 'Test Place' }],
    geometry: {
      type: 'LineString',
      coordinates: [
        [1, 1],
        [2, 2],
      ],
    },
    distanceMeters: 500,
    durationSeconds: 300,
    steps: [],
    status: 'success',
    error: null,
    ...overrides,
  };
}

// Access the `merge` option directly, the way persist middleware invokes it.
function callMerge(persistedState: unknown) {
  const options = (
    useRouteStore as unknown as { persist: { getOptions: () => any } }
  ).persist.getOptions();
  return options.merge(persistedState, useRouteStore.getState());
}

describe('useRouteStore merge (rehydration sanitizing)', () => {
  it('keeps a valid success route with geometry', () => {
    const route = makeRoute();
    const merged = callMerge({ activeRoute: route });
    expect(merged.activeRoute).toEqual(route);
  });

  it('discards a route with status "loading"', () => {
    const route = makeRoute({
      status: 'loading',
      geometry: null,
      distanceMeters: null,
      durationSeconds: null,
    });
    const merged = callMerge({ activeRoute: route });
    expect(merged.activeRoute).toBeNull();
  });

  it('discards a route with status "error"', () => {
    const route = makeRoute({ status: 'error', geometry: null, error: 'failed' });
    const merged = callMerge({ activeRoute: route });
    expect(merged.activeRoute).toBeNull();
  });

  it('discards a "success" route with null geometry', () => {
    const route = makeRoute({ geometry: null });
    const merged = callMerge({ activeRoute: route });
    expect(merged.activeRoute).toBeNull();
  });

  it('handles missing persisted state', () => {
    const merged = callMerge(undefined);
    expect(merged.activeRoute).toBeNull();
  });

  it('handles persisted state with no activeRoute key', () => {
    const merged = callMerge({});
    expect(merged.activeRoute).toBeNull();
  });

  it('backfills origin.mode/label and steps for a route persisted before the origin picker shipped', () => {
    const legacyRoute = {
      ...makeRoute(),
      origin: { latitude: 1, longitude: 1 }, // old bare-Coordinates shape
      steps: undefined,
    };
    const merged = callMerge({ activeRoute: legacyRoute });
    expect(merged.activeRoute).toEqual(
      makeRoute({
        origin: { mode: 'gps', coordinates: { latitude: 1, longitude: 1 }, label: 'Your location' },
      }),
    );
  });

  it('wraps a route persisted before multi-stop waypoints shipped (bare destination/destinationLabel) into a one-stop waypoints list', () => {
    const { waypoints: _omit, ...routeWithoutWaypoints } = makeRoute();
    const legacyRoute = {
      ...routeWithoutWaypoints,
      destination: { latitude: 2, longitude: 2 },
      destinationLabel: 'Test Place',
    };
    const merged = callMerge({ activeRoute: legacyRoute });
    expect(merged.activeRoute).toEqual(makeRoute());
  });
});

describe('useRouteStore actions', () => {
  it('setRoute stores the route', () => {
    const route = makeRoute();
    useRouteStore.getState().setRoute(route);
    expect(useRouteStore.getState().activeRoute).toEqual(route);
  });

  it('clearRoute clears the route', () => {
    useRouteStore.getState().setRoute(makeRoute());
    useRouteStore.getState().clearRoute();
    expect(useRouteStore.getState().activeRoute).toBeNull();
  });
});
