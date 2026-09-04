import { act, renderHook } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockLogAttributionSource = jest.fn();
const mockLogRateUsPrompted = jest.fn();
jest.mock('../../../../services/analytics', () => ({
  logAttributionSource: (...args: unknown[]) => mockLogAttributionSource(...args),
  logRateUsPrompted: (...args: unknown[]) => mockLogRateUsPrompted(...args),
}));

const mockRequestStoreReview = jest.fn(() => Promise.resolve());
jest.mock('../../../../services/storeReview', () => ({
  requestStoreReview: () => mockRequestStoreReview(),
}));

// eslint-disable-next-line import/first
import { useOnboardingStore } from '../../../../store/useOnboardingStore';
// eslint-disable-next-line import/first
import { useAttributionScreen } from '../useAttributionScreen';

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({ stage: 'done', attributionCompleted: false, hydrated: true });
});

describe('useAttributionScreen', () => {
  it('logs the picked source, marks the question answered, and heads to the map', () => {
    const { result } = renderHook(() => useAttributionScreen());

    act(() => result.current.handleSelect('instagram'));

    expect(mockLogAttributionSource).toHaveBeenCalledWith('instagram');
    expect(useOnboardingStore.getState().attributionCompleted).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/map');
  });

  it('logs a skip as its own outcome, not silence', () => {
    const { result } = renderHook(() => useAttributionScreen());

    act(() => result.current.handleSkip());

    expect(mockLogAttributionSource).toHaveBeenCalledWith('skipped');
    expect(useOnboardingStore.getState().attributionCompleted).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/map');
  });

  it('asks for a rating on the way out, whichever way this screen ends', () => {
    const { result } = renderHook(() => useAttributionScreen());

    act(() => result.current.handleSelect('friends'));

    expect(mockLogRateUsPrompted).toHaveBeenCalledWith('onboarding');
    expect(mockRequestStoreReview).toHaveBeenCalledTimes(1);
  });
});
