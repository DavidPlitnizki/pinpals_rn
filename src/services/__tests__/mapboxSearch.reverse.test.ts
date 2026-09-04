import { reverseGeocodeAddress, reverseGeocodePoi } from '../mapboxSearch';

jest.mock('../analytics', () => ({ logMapboxUsage: jest.fn() }));
jest.mock('../crashReporting', () => ({ reportNetworkError: jest.fn() }));

const POINT = { latitude: 32.0853, longitude: 34.7818 };

// ~0.00009° of latitude is about 10m; ~0.0018° is about 200m.
const NEAR: [number, number] = [34.7818, 32.08539];
const FAR: [number, number] = [34.7818, 32.0871];

function mockFetchOnce(json: unknown, ok = true) {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue({ ok, json: async () => json, text: async () => '' });
}

function poiFeature(name: string, coordinates: [number, number]) {
  return { geometry: { coordinates }, properties: { name, full_address: `${name} street` } };
}

describe('reverseGeocodePoi', () => {
  const originalEnv = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns the nearest POI when one sits under the point', async () => {
    mockFetchOnce({ features: [poiFeature('Far Cafe', FAR), poiFeature('Near Cafe', NEAR)] });

    const result = await reverseGeocodePoi(POINT);

    expect(result?.name).toBe('Near Cafe');
    expect(result?.distanceMeters).toBeLessThan(40);
  });

  it('ignores POIs beyond the match radius rather than naming a neighbour', async () => {
    mockFetchOnce({ features: [poiFeature('Across The Road', FAR)] });

    expect(await reverseGeocodePoi(POINT)).toBeNull();
  });

  it('returns null when the basemap knows no POI there', async () => {
    mockFetchOnce({ features: [] });

    expect(await reverseGeocodePoi(POINT)).toBeNull();
  });

  it('returns null without a token instead of calling Mapbox', async () => {
    delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await reverseGeocodePoi(POINT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('reverseGeocodeAddress', () => {
  const originalEnv = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = originalEnv;
    jest.restoreAllMocks();
  });

  it('prefers the most specific feature regardless of response order', async () => {
    mockFetchOnce({
      features: [
        { properties: { feature_type: 'place', full_address: 'Tel Aviv-Yafo, Israel' } },
        { properties: { feature_type: 'address', full_address: 'Arlozorov 98, Tel Aviv' } },
      ],
    });

    expect(await reverseGeocodeAddress(POINT)).toBe('Arlozorov 98, Tel Aviv');
  });

  it('falls back to a coarser feature where no street address exists', async () => {
    mockFetchOnce({
      features: [{ properties: { feature_type: 'place', full_address: 'Mitzpe Ramon, Israel' } }],
    });

    expect(await reverseGeocodeAddress(POINT)).toBe('Mitzpe Ramon, Israel');
  });
});
