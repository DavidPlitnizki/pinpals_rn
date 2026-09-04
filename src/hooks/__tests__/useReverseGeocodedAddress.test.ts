import { renderHook } from '@testing-library/react-native';

const mockReverseGeocodeAddress = jest.fn(() => Promise.resolve(null));
jest.mock('../../services/mapboxSearch', () => ({
  reverseGeocodeAddress: (...args: unknown[]) => mockReverseGeocodeAddress(...(args as [])),
}));

// eslint-disable-next-line import/first
import {
  primeReverseGeocodedAddress,
  useReverseGeocodedAddress,
} from '../useReverseGeocodedAddress';

beforeEach(() => {
  mockReverseGeocodeAddress.mockClear();
});

describe('useReverseGeocodedAddress', () => {
  it('uses an address a caller already looked up rather than buying it again', () => {
    const coords = { latitude: 55.75123, longitude: 37.62456 };
    primeReverseGeocodedAddress(coords, 'Tverskaya 1');

    const { result } = renderHook(() => useReverseGeocodedAddress(coords));

    // The long press that leads here reverse-geocodes the point on the way. Without priming,
    // the sheet it opens pays Mapbox a second time for the answer already in hand.
    expect(result.current).toBe('Tverskaya 1');
    expect(mockReverseGeocodeAddress).not.toHaveBeenCalled();
  });

  it('treats a primed miss as an answer, not as a gap to go and fill', () => {
    const coords = { latitude: 10.5, longitude: -20.25 };
    primeReverseGeocodedAddress(coords, null);

    const { result } = renderHook(() => useReverseGeocodedAddress(coords));

    // Open country and water have no address at all. Asking again would cost a request per
    // sheet open and return the same nothing every time.
    expect(result.current).toBeUndefined();
    expect(mockReverseGeocodeAddress).not.toHaveBeenCalled();
  });
});
