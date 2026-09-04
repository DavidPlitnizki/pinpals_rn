import { render, screen, act } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

// Reanimated's real entering/layout animations need a running UI runtime. The sheet's
// contract in a test is structural: what wraps what, and that `onEntered` always fires.
jest.mock('react-native-reanimated', () => {
  const { View: RNView } = jest.requireActual<typeof import('react-native')>('react-native');
  const passthrough = { duration: () => passthrough, withCallback: () => passthrough };
  return {
    __esModule: true,
    default: { View: RNView },
    FadeIn: passthrough,
    FadeOut: passthrough,
    SlideInDown: passthrough,
    SlideOutDown: passthrough,
    LinearTransition: passthrough,
    runOnJS: (fn: unknown) => fn,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

// eslint-disable-next-line import/first
import { MapCardSheet } from '../MapCardSheet';

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return (style ?? {}) as Record<string, unknown>;
}

describe('MapCardSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clips its contents one level below the view that casts the shadow', () => {
    render(
      <MapCardSheet>
        <Text>Card body</Text>
      </MapCardSheet>,
    );

    const views = screen.UNSAFE_getAllByType(View).map((node) => flatten(node.props.style));
    const shadow = views.find((style) => style.shadowOpacity !== undefined);
    const clip = views.find((style) => style.overflow === 'hidden');

    expect(shadow).toBeDefined();
    expect(clip).toBeDefined();
    // iOS draws a view's shadow on the same layer `overflow: 'hidden'` clips, so one view
    // cannot do both — it loses the shadow. They have to stay on separate views.
    expect(shadow!.overflow).toBeUndefined();
    expect(clip!.shadowOpacity).toBeUndefined();
    expect(screen.getByText('Card body')).toBeTruthy();
  });

  it('caps the card well short of the screen, measured between the safe areas', () => {
    render(
      <MapCardSheet>
        <Text>Card body</Text>
      </MapCardSheet>,
    );

    const clip = screen
      .UNSAFE_getAllByType(View)
      .map((node) => flatten(node.props.style))
      .find((style) => style.overflow === 'hidden');

    // A cap, never a fixed height: a short card must not drag an empty white panel below its
    // content, which is what a height did.
    expect(clip!.height).toBeUndefined();
    expect(typeof clip!.maxHeight).toBe('number');
    // Whatever the ratio, the cap has to leave the notch and the home indicator alone.
    const { height } = jest
      .requireActual<typeof import('react-native')>('react-native')
      .Dimensions.get('window');
    expect(clip!.maxHeight as number).toBeLessThan(height - 47 - 34);
  });

  it('reports that it has settled even when the animation never calls back', () => {
    const onEntered = jest.fn();
    render(
      <MapCardSheet onEntered={onEntered}>
        <Text>Card body</Text>
      </MapCardSheet>,
    );

    // The onboarding highlight measures the card only once it has stopped moving. A card that
    // is interrupted, or never animates at all, would otherwise leave it waiting forever.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onEntered).toHaveBeenCalledTimes(1);
  });
});
