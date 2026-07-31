import { getDirections } from '../directions';

const ORIGIN = { latitude: 55.75, longitude: 37.62 };
const DESTINATION = { latitude: 55.76, longitude: 37.64 };

function mockFetchOnce(response: Partial<Response> & { json: () => Promise<unknown> }) {
  globalThis.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('getDirections', () => {
  const originalEnv = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  afterEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = originalEnv;
    jest.restoreAllMocks();
  });

  it('builds the URL with lon,lat coordinate order and ; separator', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({
      ok: true,
      json: async () => ({
        routes: [{ geometry: { type: 'LineString', coordinates: [] }, distance: 100, duration: 60 }],
      }),
    } as Response);

    await getDirections(ORIGIN, DESTINATION, 'walking');

    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain(
      `/walking/${ORIGIN.longitude},${ORIGIN.latitude};${DESTINATION.longitude},${DESTINATION.latitude}`,
    );
    expect(calledUrl).toContain('access_token=test-token');
  });

  it('returns geometry, distance, and duration from the first route', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    const geometry = { type: 'LineString', coordinates: [[1, 2]] } as GeoJSON.LineString;
    mockFetchOnce({
      ok: true,
      json: async () => ({ routes: [{ geometry, distance: 1234, duration: 567 }] }),
    } as Response);

    const result = await getDirections(ORIGIN, DESTINATION, 'driving');

    expect(result.geometry).toEqual(geometry);
    expect(result.distanceMeters).toBe(1234);
    expect(result.durationSeconds).toBe(567);
    expect(result.steps).toEqual([]);
  });

  it('requests steps and parses them into RouteStep shape', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({
      ok: true,
      json: async () => ({
        routes: [
          {
            geometry: { type: 'LineString', coordinates: [] },
            distance: 100,
            duration: 60,
            legs: [
              {
                steps: [
                  { distance: 50, maneuver: { instruction: 'Turn left', location: [37.63, 55.755] } },
                  { distance: 50, maneuver: { instruction: 'Arrive', location: [37.64, 55.76] } },
                ],
              },
            ],
          },
        ],
      }),
    } as Response);

    const result = await getDirections(ORIGIN, DESTINATION, 'walking');

    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('steps=true');
    expect(result.steps).toEqual([
      { instruction: 'Turn left', distanceMeters: 50, maneuverLocation: { longitude: 37.63, latitude: 55.755 } },
      { instruction: 'Arrive', distanceMeters: 50, maneuverLocation: { longitude: 37.64, latitude: 55.76 } },
    ]);
  });

  it('passes an AbortSignal through to fetch when provided', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({
      ok: true,
      json: async () => ({
        routes: [{ geometry: { type: 'LineString', coordinates: [] }, distance: 1, duration: 1 }],
      }),
    } as Response);
    const controller = new AbortController();

    await getDirections(ORIGIN, DESTINATION, 'walking', controller.signal);

    expect((fetch as jest.Mock).mock.calls[0][1]).toEqual({ signal: controller.signal });
  });

  it('throws when the HTTP response is not ok', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({ ok: false, status: 500, json: async () => ({}) } as Response);

    await expect(getDirections(ORIGIN, DESTINATION, 'walking')).rejects.toThrow(
      'Mapbox directions failed: 500',
    );
  });

  it('throws when routes is an empty array', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({ ok: true, json: async () => ({ routes: [] }) } as Response);

    await expect(getDirections(ORIGIN, DESTINATION, 'walking')).rejects.toThrow('No route found');
  });

  it('throws when routes is missing entirely', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
    mockFetchOnce({ ok: true, json: async () => ({}) } as Response);

    await expect(getDirections(ORIGIN, DESTINATION, 'walking')).rejects.toThrow('No route found');
  });

  it('still issues a request with an empty access_token when EXPO_PUBLIC_MAPBOX_TOKEN is missing', async () => {
    delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    mockFetchOnce({
      ok: true,
      json: async () => ({
        routes: [{ geometry: { type: 'LineString', coordinates: [] }, distance: 1, duration: 1 }],
      }),
    } as Response);

    await getDirections(ORIGIN, DESTINATION, 'cycling');

    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('access_token=');
    expect(calledUrl).not.toContain('access_token=undefined');
  });
});
