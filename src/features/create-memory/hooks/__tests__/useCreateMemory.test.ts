import { renderHook, act } from '@testing-library/react-native';

// ─── mocks ─────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
const mockAddNote = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ placeId: 'place-1' }),
}));

jest.mock('../../../../store/usePlacesStore', () => ({
  usePlacesStore: () => ({
    addNote: mockAddNote,
    places: [
      {
        id: 'place-1',
        name: 'Test Café',
        coordinates: { latitude: 55.75, longitude: 37.62 },
        category: 'coffee',
        rating: 4,
        isFavorite: false,
        tags: [],
        visitCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  }),
}));

// eslint-disable-next-line import/first
import { useCreateMemory } from '../useCreateMemory';

// ─── helpers ───────────────────────────────────────────────────────────────

function renderCreateMemory() {
  return renderHook(() => useCreateMemory());
}

// ─── initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts at step 0', () => {
    const { result } = renderCreateMemory();
    expect(result.current.step).toBe(0);
  });

  it('totalSteps is 5', () => {
    const { result } = renderCreateMemory();
    expect(result.current.totalSteps).toBe(5);
  });

  it('isLastStep is false on first step', () => {
    const { result } = renderCreateMemory();
    expect(result.current.isLastStep).toBe(false);
  });

  it('resolves place from store by placeId param', () => {
    const { result } = renderCreateMemory();
    expect(result.current.place?.id).toBe('place-1');
  });
});

// ─── canGoNext ─────────────────────────────────────────────────────────────

describe('canGoNext', () => {
  it('step 0 (photos): always true', () => {
    const { result } = renderCreateMemory();
    expect(result.current.step).toBe(0);
    expect(result.current.canGoNext).toBe(true);
  });

  // Mood used to be the one required step; it isn't any more — a memory can be saved with
  // nothing but its place and date, and skipped fields can be added later by editing it.
  it('step 1 (mood): true even with no mood selected', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep()); // → step 1
    expect(result.current.step).toBe(1);
    expect(result.current.canGoNext).toBe(true);
  });

  it('step 1 (mood): true after mood is selected', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep());
    act(() => result.current.setMood('happy'));
    expect(result.current.canGoNext).toBe(true);
  });

  it('step 2 (companions): always true', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep()); // step 1
    act(() => result.current.setMood('calm'));
    act(() => result.current.nextStep()); // step 2
    expect(result.current.canGoNext).toBe(true);
  });

  it('step 3 (note): always true', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep());
    act(() => result.current.setMood('calm'));
    act(() => result.current.nextStep());
    act(() => result.current.nextStep()); // step 3
    expect(result.current.canGoNext).toBe(true);
  });

  it('step 4 (date): always true', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep());
    act(() => result.current.setMood('calm'));
    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    act(() => result.current.nextStep()); // step 4
    expect(result.current.canGoNext).toBe(true);
    expect(result.current.isLastStep).toBe(true);
  });
});

// ─── nextStep / prevStep ───────────────────────────────────────────────────

describe('nextStep', () => {
  it('increments step', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep());
    expect(result.current.step).toBe(1);
  });

  it('does not go beyond last step', () => {
    const { result } = renderCreateMemory();
    for (let i = 0; i < 10; i++) {
      act(() => result.current.nextStep());
    }
    expect(result.current.step).toBe(4); // max is totalSteps - 1
  });
});

describe('prevStep', () => {
  it('decrements step', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.nextStep());
    act(() => result.current.prevStep());
    expect(result.current.step).toBe(0);
  });

  it('calls router.back() when at step 0', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.prevStep());
    expect(mockBack).toHaveBeenCalled();
  });
});

// ─── companions ────────────────────────────────────────────────────────────

describe('addCompanion / removeCompanion', () => {
  it('adds a companion', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.addCompanion('Анна'));
    expect(result.current.companions).toContain('Анна');
  });

  it('does not add duplicate companions', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.addCompanion('Анна'));
    act(() => result.current.addCompanion('Анна'));
    expect(result.current.companions).toHaveLength(1);
  });

  it('removes a companion', () => {
    const { result } = renderCreateMemory();
    act(() => result.current.addCompanion('Анна'));
    act(() => result.current.removeCompanion('Анна'));
    expect(result.current.companions).toHaveLength(0);
  });
});

// ─── handleSave ────────────────────────────────────────────────────────────

describe('handleSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBack.mockReset();
  });

  it('calls addNote with correct placeId and text', async () => {
    const { result } = renderCreateMemory();
    act(() => result.current.setText('Было здорово!'));
    await act(async () => result.current.handleSave());
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: 'place-1', text: 'Было здорово!' }),
    );
  });

  it('trims whitespace from text before saving', async () => {
    const { result } = renderCreateMemory();
    act(() => result.current.setText('  пробелы  '));
    await act(async () => result.current.handleSave());
    expect(mockAddNote).toHaveBeenCalledWith(expect.objectContaining({ text: 'пробелы' }));
  });

  it('calls router.back() after saving', async () => {
    const { result } = renderCreateMemory();
    await act(async () => result.current.handleSave());
    expect(mockBack).toHaveBeenCalled();
  });

  it('includes companions in saved note', async () => {
    const { result } = renderCreateMemory();
    act(() => result.current.addCompanion('Петр'));
    await act(async () => result.current.handleSave());
    expect(mockAddNote).toHaveBeenCalledWith(expect.objectContaining({ companions: ['Петр'] }));
  });

  it('includes selected mood in saved note', async () => {
    const { result } = renderCreateMemory();
    act(() => result.current.setMood('nostalgic'));
    await act(async () => result.current.handleSave());
    expect(mockAddNote).toHaveBeenCalledWith(expect.objectContaining({ mood: 'nostalgic' }));
  });
});
