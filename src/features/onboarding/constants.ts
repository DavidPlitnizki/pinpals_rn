import React from 'react';
import { CopilotProps } from 'react-native-copilot';

import { Colors, Radii } from '../../design-system/tokens';
import { OnboardingTooltip } from './components/OnboardingTooltip';

export * from './steps';

// Gap copilot leaves between the ringed target and its tooltip. A caller can widen it per
// step — the save hint does, to lift the tooltip clear of the card its target sits inside.
export const ONBOARDING_TOOLTIP_MARGIN = 16;

function NoStepNumber(): React.ReactElement | null {
  return null;
}

// Shared look for both providers, so the two halves of the tour read as one thing.
export const ONBOARDING_COPILOT_OPTIONS: CopilotProps = {
  // The View mask, not the SVG one, and stated rather than left to the library's own probe of
  // `NativeModules.RNSVGSvgViewManager` — a Paper-era check that always reads "undefined"
  // under the New Architecture (this app builds with RCT_NEW_ARCH_ENABLED), so what it picks
  // is right here by luck rather than by reason.
  //
  // It has to be the View mask. SvgMask computes its cut-out path at render time and pushes
  // every later update through `maskRef.current.setNativeProps({ d })`, which does nothing
  // under the New Architecture: the hole keeps whatever the first render produced, so it
  // freezes part-way through the move and slices across the card it was meant to ring.
  // Turning the animation off hid that but cost the movement. ViewMask has no setNativeProps
  // at all — it drives four Animated.View overlays through animated style values, which do
  // land — so it both lands on target and keeps the animation.
  //
  // The one thing given up is rounded corners on the cut-out: the View mask can only cut a
  // rectangle.
  overlay: 'view',
  animated: true,
  tooltipComponent: OnboardingTooltip,
  // Both tours are one step long, so copilot's numbered badge would only ever read "1" —
  // a counter for a sequence that does not exist. Rendering nothing removes it.
  stepNumberComponent: NoStepNumber,
  labels: { finish: 'Got it', skip: 'Skip', next: 'Next', previous: 'Back' },
  backdropColor: 'rgba(28, 43, 34, 0.78)',
  arrowColor: Colors.white,
  animationDuration: 220,
  margin: ONBOARDING_TOOLTIP_MARGIN,
  tooltipStyle: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    padding: 0,
  },
  // The tour is two taps long; letting a stray tap on the backdrop end it silently is worse
  // than making the button the only way out.
  stopOnOutsideClick: false,
};
