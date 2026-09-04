import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// The form's own lookups would reach the network; none of them matter to the memory hint.
jest.mock('../../../../services/mapboxSearch', () => ({
  reverseGeocodeAddress: () => Promise.resolve(null),
}));
jest.mock('../../../../hooks/usePlaceCoverImage', () => ({
  useCoverImage: () => ({ uri: null, loading: false, source: null }),
}));

// eslint-disable-next-line import/first
import { QuickAddPlaceSheet } from '../QuickAddPlaceSheet';
// eslint-disable-next-line import/first
import { MEMORY_TIP_TEXT, ONBOARDING_LABEL, SAVE_PIN_TIP_TEXT } from '../../../onboarding/steps';

const COORDS = { latitude: 55.75, longitude: 37.62 };
const noop = () => {};

function renderSheet(props: Partial<React.ComponentProps<typeof QuickAddPlaceSheet>> = {}) {
  return render(
    <QuickAddPlaceSheet
      visible
      coordinates={COORDS}
      // Given, so the form does not start its own reverse lookup — nothing here is about the
      // address, and an unawaited one resolves after the test has finished.
      address="Tverskaya 1"
      onSave={noop}
      onClose={noop}
      onDirections={noop}
      {...props}
    />,
  );
}

describe('QuickAddPlaceSheet memory hint', () => {
  it('offers the same Add Memory button a saved place does', () => {
    renderSheet();

    // Adding a memory here and on a place's own screen are the same act; two different-looking
    // buttons for it made the form's version read as a lesser, optional thing.
    expect(screen.getByText('Add Memory')).toBeTruthy();
  });

  it('reports the hint as done the moment the button is pressed', () => {
    const onMemoryHighlightDone = jest.fn();
    renderSheet({ highlightMemory: true, onMemoryHighlightDone });

    fireEvent.press(screen.getByText('Add Memory'));

    // Pressing it is the hint's whole purpose — leaving the arrow up afterwards would point
    // at a button the user has already found.
    expect(onMemoryHighlightDone).toHaveBeenCalledTimes(1);
  });

  it('points up at the tick once the memory is written, and says why', () => {
    renderSheet({ highlightSave: true });

    // The tick is the top-left corner of the sheet, so the arrow sits under it pointing up.
    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-up' })).toHaveLength(1);
    // Closing the form instead of saving throws the memory away with it — worth a sentence.
    expect(screen.getByText(SAVE_PIN_TIP_TEXT)).toBeTruthy();
    expect(screen.getByText(ONBOARDING_LABEL.toUpperCase())).toBeTruthy();
    // Fourth of the tour's five hints — the memory hint before it is the third.
    expect(screen.getByText('4/5')).toBeTruthy();
  });

  it('shows only one of the two form hints at a time, each captioned the same way', () => {
    renderSheet({ highlightMemory: true });

    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-down' })).toHaveLength(1);
    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-up' })).toHaveLength(0);
    // One explained hint and one bare arrow would read as an accident.
    expect(screen.getByText(MEMORY_TIP_TEXT)).toBeTruthy();
    expect(screen.getByText(ONBOARDING_LABEL.toUpperCase())).toBeTruthy();
    expect(screen.getByText('3/5')).toBeTruthy();
  });

  it('puts the arrow over the button only while the hint is running', () => {
    const { rerender } = renderSheet({ highlightMemory: true });
    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-down' })).toHaveLength(1);

    rerender(
      <QuickAddPlaceSheet
        visible
        coordinates={COORDS}
        address="Tverskaya 1"
        onSave={noop}
        onClose={noop}
        onDirections={noop}
        highlightMemory={false}
      />,
    );

    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-down' })).toHaveLength(0);
  });
});
