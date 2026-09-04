import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockHandleSelect = jest.fn();
const mockHandleSkip = jest.fn();

jest.mock('../hooks/useAttributionScreen', () => ({
  useAttributionScreen: () => ({
    handleSelect: mockHandleSelect,
    handleSkip: mockHandleSkip,
  }),
}));

// eslint-disable-next-line import/first
import AttributionScreen from '../AttributionScreen';

beforeEach(() => {
  mockHandleSelect.mockClear();
  mockHandleSkip.mockClear();
});

describe('AttributionScreen', () => {
  it('reports the exact source tapped', () => {
    render(<AttributionScreen />);

    fireEvent.press(screen.getByText('Instagram'));

    expect(mockHandleSelect).toHaveBeenCalledWith('instagram');
  });

  it('offers every source once', () => {
    render(<AttributionScreen />);

    expect(screen.getByText('Facebook')).toBeTruthy();
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('X (Twitter)')).toBeTruthy();
    expect(screen.getByText('Telegram')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText('Something else')).toBeTruthy();
  });

  it('offers a way out via the circled X, for anyone who does not want to say', () => {
    render(<AttributionScreen />);

    fireEvent.press(screen.getByLabelText('Skip this question'));

    expect(mockHandleSkip).toHaveBeenCalledTimes(1);
    expect(mockHandleSelect).not.toHaveBeenCalled();
  });
});
