import { render, screen } from '@testing-library/react-native';
import React from 'react';

// The card is what a long press and a tap both land on, and three of this branch's bugs lived
// in it: details bought twice, a placeholder name reaching the save form, and the onboarding
// highlight swallowing the card. Rendering it is the only way to hold those down.

const mockReverseGeocodeAddress = jest.fn(() => Promise.resolve(null));
const mockRetrieveMapboxPlace = jest.fn(() => Promise.resolve(null));
const mockSearchMapboxPlaces = jest.fn(() => Promise.resolve([]));
jest.mock('../../../../services/mapboxSearch', () => ({
  reverseGeocodeAddress: (...args: unknown[]) => mockReverseGeocodeAddress(...(args as [])),
  retrieveMapboxPlace: (...args: unknown[]) => mockRetrieveMapboxPlace(...(args as [])),
  searchMapboxPlaces: (...args: unknown[]) => mockSearchMapboxPlaces(...(args as [])),
}));

// copilot's real provider needs a mounted overlay; the card only cares that a step wraps it.
jest.mock('react-native-copilot', () => ({
  CopilotStep: ({ children }: { children: React.ReactNode }) => children,
  walkthroughable: (Component: unknown) => Component,
}));

// eslint-disable-next-line import/first
import { NativePoiCallout } from '../NativePoiMarker';

const COORDS = { latitude: 55.75, longitude: 37.62 };

const noop = () => {};

function renderCallout(
  marker: Parameters<typeof NativePoiCallout>[0]['marker'],
  highlight = false,
) {
  return render(
    <NativePoiCallout
      marker={marker}
      onClose={noop}
      onDirections={noop}
      onAddPlace={noop}
      highlightAdd={highlight}
    />,
  );
}

beforeEach(() => {
  mockReverseGeocodeAddress.mockClear();
});

describe('NativePoiCallout', () => {
  it('shows a long-pressed point without buying its details a second time', () => {
    renderCallout({
      id: 'pin-1',
      name: 'Blue Bottle',
      coordinates: COORDS,
      resolvedDetails: { address: '1 Ferry Building', phone: '+14155551234' },
    });

    expect(screen.getByText('Blue Bottle')).toBeTruthy();
    expect(screen.getByText('1 Ferry Building')).toBeTruthy();
    // The reverse lookup behind the long press already answered — `resolvedDetails` is that
    // answer, and an absent field in it means "known to be unavailable", not "not asked yet".
    expect(mockReverseGeocodeAddress).not.toHaveBeenCalled();
  });

  it('shuts the actions that would carry a placeholder name while the lookup is in flight', () => {
    renderCallout({
      id: 'pin-1',
      name: 'Looking up this spot…',
      coordinates: COORDS,
      resolvedDetails: {},
      pending: true,
    });

    // Saving now would seed the form with the placeholder; a web search would search for it.
    expect(screen.getByLabelText('Save this place')).toBeDisabled();
    expect(screen.getByLabelText('Search the web for this place')).toBeDisabled();
    // Directions needs only the coordinates, and those were final at the moment of the press.
    expect(screen.getByLabelText('Directions to this place')).toBeEnabled();
  });

  it('keeps every action row button on the card while the tour points at Save', () => {
    renderCallout(
      { id: 'poi-1', name: 'Central Park', coordinates: COORDS, resolvedDetails: {} },
      true,
    );

    // The highlight wraps the card in a copilot step and dims everything above the actions.
    // It must not cost the card its buttons — that is the shape the clipping bug took.
    expect(screen.getByLabelText('Save this place')).toBeEnabled();
    expect(screen.getByLabelText('Directions to this place')).toBeTruthy();
    expect(screen.getByLabelText('Search the web for this place')).toBeTruthy();
    expect(screen.getByText('Central Park')).toBeTruthy();
  });
});
