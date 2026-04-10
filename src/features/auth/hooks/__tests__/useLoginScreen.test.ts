import { renderHook, act } from '@testing-library/react-native';

// ─── mocks ─────────────────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockSkipAuth = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, skipAuth: mockSkipAuth }),
}));

// eslint-disable-next-line import/first
import { useLoginScreen } from '../useLoginScreen';

// ─── helpers ───────────────────────────────────────────────────────────────

function renderLogin() {
  return renderHook(() => useLoginScreen());
}

// ─── validation ────────────────────────────────────────────────────────────

describe('validation (via handleLogin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets error for email without @', async () => {
    const { result } = renderLogin();
    act(() => result.current.setEmail('notanemail'));
    act(() => result.current.setPassword('password123'));
    await act(() => result.current.handleLogin());
    expect(result.current.error).toMatch(/valid email/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('sets error for password shorter than 6 characters', async () => {
    const { result } = renderLogin();
    act(() => result.current.setEmail('user@test.com'));
    act(() => result.current.setPassword('abc'));
    await act(() => result.current.handleLogin());
    expect(result.current.error).toMatch(/6 characters/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('clears previous error and calls login when credentials are valid', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { result } = renderLogin();
    // First set an error
    act(() => result.current.setEmail('bad'));
    await act(() => result.current.handleLogin());
    expect(result.current.error).not.toBeNull();

    // Now fix credentials
    act(() => result.current.setEmail('good@test.com'));
    act(() => result.current.setPassword('secret123'));
    await act(() => result.current.handleLogin());
    expect(result.current.error).toBeNull();
    expect(mockLogin).toHaveBeenCalledWith('good@test.com', 'secret123');
  });
});

// ─── handleLogin ───────────────────────────────────────────────────────────

describe('handleLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets isLoading to true while logging in then false after', async () => {
    let resolve: () => void;
    mockLogin.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderLogin();
    act(() => result.current.setEmail('user@test.com'));
    act(() => result.current.setPassword('password123'));

    let loginPromise: Promise<void>;
    act(() => {
      loginPromise = result.current.handleLogin();
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!();
      await loginPromise;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error when login throws', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderLogin();
    act(() => result.current.setEmail('user@test.com'));
    act(() => result.current.setPassword('password123'));
    await act(() => result.current.handleLogin());
    expect(result.current.error).toBe('Invalid credentials');
  });
});

// ─── navigation helpers ────────────────────────────────────────────────────

describe('goToSignUp / goToResetPassword', () => {
  it('goToSignUp pushes to sign-up route', () => {
    const { result } = renderLogin();
    act(() => result.current.goToSignUp());
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('goToResetPassword pushes to reset-password route', () => {
    const { result } = renderLogin();
    act(() => result.current.goToResetPassword());
    expect(mockPush).toHaveBeenCalledWith('/(auth)/reset-password');
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
});
