import { renderHook, act } from '@testing-library/react-native';

// ─── mocks ─────────────────────────────────────────────────────────────────

const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
const mockSkipAuth = jest.fn();
const mockPush = jest.fn();

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
    skipAuth: mockSkipAuth,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// eslint-disable-next-line import/first
import { useLoginScreen } from '../useLoginScreen';

// ─── helpers ───────────────────────────────────────────────────────────────

function renderLogin() {
  return renderHook(() => useLoginScreen());
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── handleGooglePress ─────────────────────────────────────────────────────

describe('handleGooglePress', () => {
  it('sets isLoading to true while signing in then false after', async () => {
    let resolve: () => void;
    mockSignInWithGoogle.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderLogin();

    let pressPromise: Promise<void>;
    act(() => {
      pressPromise = result.current.handleGooglePress();
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!();
      await pressPromise;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error when sign-in throws', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Google sign-in failed.'));
    const { result } = renderLogin();
    await act(() => result.current.handleGooglePress());
    expect(result.current.error).toBe('Google sign-in failed.');
  });

  it('clears a previous error on a new attempt', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('first failure'));
    const { result } = renderLogin();
    await act(() => result.current.handleGooglePress());
    expect(result.current.error).toBe('first failure');

    mockSignInWithGoogle.mockResolvedValueOnce(undefined);
    await act(() => result.current.handleGooglePress());
    expect(result.current.error).toBeNull();
  });
});

// ─── handleApplePress ──────────────────────────────────────────────────────

describe('handleApplePress', () => {
  it('calls signInWithApple and sets error on failure', async () => {
    mockSignInWithApple.mockRejectedValue(new Error('Apple sign-in failed.'));
    const { result } = renderLogin();
    await act(() => result.current.handleApplePress());
    expect(mockSignInWithApple).toHaveBeenCalled();
    expect(result.current.error).toBe('Apple sign-in failed.');
  });
});

// ─── handleSkip ────────────────────────────────────────────────────────────

describe('handleSkip', () => {
  it('calls skipAuth', async () => {
    mockSkipAuth.mockResolvedValue(undefined);
    const { result } = renderLogin();
    await act(() => result.current.handleSkip());
    expect(mockSkipAuth).toHaveBeenCalled();
  });

  it('sets error when skipAuth throws', async () => {
    mockSkipAuth.mockRejectedValue(new Error('Anonymous sign-in disabled.'));
    const { result } = renderLogin();
    await act(() => result.current.handleSkip());
    expect(result.current.error).toBe('Anonymous sign-in disabled.');
  });
});

// ─── goToTerms / goToPrivacy ───────────────────────────────────────────────

describe('goToTerms / goToPrivacy', () => {
  it('goToTerms pushes the terms legal route', () => {
    const { result } = renderLogin();
    act(() => result.current.goToTerms());
    expect(mockPush).toHaveBeenCalledWith('/legal?type=terms');
  });

  it('goToPrivacy pushes the privacy legal route', () => {
    const { result } = renderLogin();
    act(() => result.current.goToPrivacy());
    expect(mockPush).toHaveBeenCalledWith('/legal?type=privacy');
  });
});
