import { act, renderHook } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// eslint-disable-next-line import/first
import { useOnboardingStore } from '../../../../store/useOnboardingStore';
// eslint-disable-next-line import/first
import { useWelcomeOnboardingScreen } from '../useWelcomeOnboardingScreen';

beforeEach(() => {
  mockReplace.mockClear();
  useOnboardingStore.setState({ stage: 'welcome', hydrated: true });
});

describe('useWelcomeOnboardingScreen', () => {
  it('advances the stage past welcome and heads to the map', () => {
    const { result } = renderHook(() => useWelcomeOnboardingScreen());

    act(() => result.current.handleStart());

    // Advancing rather than skipping — the map hint is still owed to this person.
    expect(useOnboardingStore.getState().stage).toBe('map-tip');
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/map');
  });

  it('ends the whole tour on skip, not just this screen', () => {
    const { result } = renderHook(() => useWelcomeOnboardingScreen());

    act(() => result.current.handleSkip());

    // Nothing later ever offers this choice again — this is the one chance to record it.
    expect(useOnboardingStore.getState().stage).toBe('done');
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/map');
  });
});
