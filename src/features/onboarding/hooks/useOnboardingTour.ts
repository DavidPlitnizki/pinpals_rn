import { useCallback, useEffect, useRef } from 'react';
import { useCopilot } from 'react-native-copilot';

interface Options {
  // Whether this tour should be running right now — the persisted stage, plus whatever local
  // condition makes the step's target exist (the sheet being open, the screen focused).
  active: boolean;
  stepName: string;
  // Wait this long after going active before measuring. The target may still be animating in
  // — a card sliding up from the bottom — and copilot measures through a ref exactly once, so
  // an early measurement freezes the spotlight over wherever the target was mid-flight.
  startDelayMs?: number;
  // Called once the user dismisses the tooltip. Not called when the app pulls the tooltip
  // down itself: that is not the user seeing it, and the stage must not advance on it.
  onFinish: () => void;
}

// Drives one single-step copilot tour from app state instead of from copilot's own cursor.
// Must be called from inside the CopilotProvider that owns the step.
export function useOnboardingTour({ active, stepName, onFinish, startDelayMs = 0 }: Options): void {
  const { start, stop, copilotEvents, visible } = useCopilot();

  // Everything from copilot is reached through a ref, and none of it appears in a dependency
  // array. `start` and `stop` are rebuilt whenever a step registers — which happens right
  // after this hook schedules its first frame — so depending on them re-runs the start
  // effect, and the re-run's cleanup cancels the very frame that was about to start the tour.
  // Nothing reschedules it, and the tour then never appears and never errors.
  const startRef = useRef(start);
  const stopRef = useRef(stop);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    startRef.current = start;
    stopRef.current = stop;
    onFinishRef.current = onFinish;
  }, [start, stop, onFinish]);

  // True only between this hook calling start() and the resulting stop. Both halves of the
  // tour share one provider, so `visible` and the 'stop' event are provider-wide: without
  // this, the idle half sees the other half's tooltip as its own — it reports that tooltip's
  // dismissal as its own step being finished, and, seeing itself inactive while something is
  // visible, tears the other half's tooltip down a frame after it appears.
  const hasStartedRef = useRef(false);

  // Copilot emits the same 'stop' event whether the user dismissed the tooltip or the app
  // pulled it down. Only the first means the step was seen.
  const suppressFinishRef = useRef(false);

  const handleStop = useCallback(() => {
    if (!hasStartedRef.current) return;
    hasStartedRef.current = false;

    if (suppressFinishRef.current) {
      suppressFinishRef.current = false;
      return;
    }
    onFinishRef.current();
  }, []);

  useEffect(() => {
    copilotEvents.on('stop', handleStop);
    return () => {
      copilotEvents.off('stop', handleStop);
    };
  }, [copilotEvents, handleStop]);

  useEffect(() => {
    if (!active) return;

    // The step measures its target through a ref, so the target has to be laid out — and done
    // moving — before the tour starts. Two frames covers a cold mount; `startDelayMs` covers
    // a target that animates into place. Frames rather than InteractionManager, which RN 0.86
    // deprecates for removal.
    let inner = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const begin = () => {
      inner = requestAnimationFrame(() => {
        hasStartedRef.current = true;
        void startRef.current(stepName);
      });
    };

    const outer = requestAnimationFrame(() => {
      if (startDelayMs > 0) {
        timer = setTimeout(begin, startDelayMs);
        return;
      }
      begin();
    });

    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
      if (timer) clearTimeout(timer);
    };
  }, [active, stepName, startDelayMs]);

  // Pulls down a tooltip whose target has gone: the sheet dismissed by a hardware back press,
  // the stage rewound from Profile. An overlay pointing at a view that no longer exists
  // strands the user behind a backdrop with nothing under it.
  useEffect(() => {
    if (active || !visible || !hasStartedRef.current) return;

    suppressFinishRef.current = true;
    void stopRef.current();
  }, [active, visible]);
}
