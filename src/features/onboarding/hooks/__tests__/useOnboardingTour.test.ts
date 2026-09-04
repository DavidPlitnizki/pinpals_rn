import { act, renderHook } from '@testing-library/react-native';
import mitt from 'mitt';

import { useOnboardingTour } from '../useOnboardingTour';

// `mock`-prefixed so jest's out-of-scope guard lets the factory below close over them.
const mockCopilotEvents = mitt<{ start: undefined; stop: undefined; stepChange: undefined }>();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockCopilot = { visible: false };

jest.mock('react-native-copilot', () => ({
  useCopilot: () => ({
    start: mockStart,
    stop: mockStop,
    copilotEvents: mockCopilotEvents,
    visible: mockCopilot.visible,
  }),
}));

const STEP = 'map-long-press';

describe('useOnboardingTour', () => {
  beforeEach(() => {
    // The hook defers the start by two animation frames; run them synchronously so the tests
    // don't have to schedule around real frames.
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    mockStart.mockClear();
    mockStop.mockClear();
    mockCopilot.visible = false;
    mockCopilotEvents.all.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts the tour once while active, not on every re-render', () => {
    const { rerender } = renderHook(
      (props: { active: boolean }) =>
        useOnboardingTour({ active: props.active, stepName: STEP, onFinish: jest.fn() }),
      { initialProps: { active: true } },
    );

    rerender({ active: true });

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith(STEP);
  });

  it('waits out an animating target before measuring it', () => {
    // The save hint points into a card that slides up from the bottom edge. Copilot measures
    // through a ref exactly once, so starting early freezes the cut-out over wherever the
    // button was mid-flight — which reads as the card being sliced in half.
    jest.useFakeTimers();

    renderHook(() =>
      useOnboardingTour({
        active: true,
        stepName: STEP,
        onFinish: jest.fn(),
        startDelayMs: 220,
      }),
    );

    expect(mockStart).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(mockStart).toHaveBeenCalledWith(STEP);
    jest.useRealTimers();
  });

  it('does not start while inactive', () => {
    renderHook(() => useOnboardingTour({ active: false, stepName: STEP, onFinish: jest.fn() }));

    expect(mockStart).not.toHaveBeenCalled();
  });

  it('runs again after going inactive — this is what replaying from Profile relies on', () => {
    const { rerender } = renderHook(
      (props: { active: boolean }) =>
        useOnboardingTour({ active: props.active, stepName: STEP, onFinish: jest.fn() }),
      { initialProps: { active: true } },
    );

    rerender({ active: false });
    rerender({ active: true });

    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  it('reports a finish when the user dismisses the tooltip', () => {
    const onFinish = jest.fn();
    renderHook(() => useOnboardingTour({ active: true, stepName: STEP, onFinish }));

    act(() => {
      mockCopilotEvents.emit('stop');
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('ignores a stop meant for the other tour sharing the same provider', () => {
    // Both halves of the tour subscribe to one provider's events. An idle hook must stay
    // silent, or dismissing the map hint would also mark the save hint done and skip it.
    const onFinish = jest.fn();
    renderHook(() => useOnboardingTour({ active: false, stepName: STEP, onFinish }));

    act(() => {
      mockCopilotEvents.emit('stop');
    });

    expect(onFinish).not.toHaveBeenCalled();
  });

  it('does not tear down a tooltip that belongs to the other tour', () => {
    // `visible` is provider-wide. An idle hook seeing the other half's tooltip must leave it
    // alone — calling stop() here killed the map hint one frame after it appeared, and the
    // stage advanced as if the user had read it.
    mockCopilot.visible = true;

    renderHook(() => useOnboardingTour({ active: false, stepName: STEP, onFinish: jest.fn() }));

    expect(mockStop).not.toHaveBeenCalled();
  });

  it('does not report a finish for a tooltip the app pulled down itself', () => {
    // Going inactive with the tooltip up (the sheet closed mid-hint) stops copilot from the
    // app side. That stop must not count as "the user saw it" — the stage would advance and
    // the hint would never be shown again.
    mockCopilot.visible = true;
    const onFinish = jest.fn();
    mockStop.mockImplementation(() => {
      mockCopilotEvents.emit('stop');
    });

    const { rerender } = renderHook(
      (props: { active: boolean }) =>
        useOnboardingTour({ active: props.active, stepName: STEP, onFinish }),
      { initialProps: { active: true } },
    );

    act(() => {
      rerender({ active: false });
    });

    expect(mockStop).toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
