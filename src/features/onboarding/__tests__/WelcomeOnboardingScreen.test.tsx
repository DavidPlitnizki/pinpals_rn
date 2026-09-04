import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockHandleStart = jest.fn();
const mockHandleSkip = jest.fn();

jest.mock('../hooks/useWelcomeOnboardingScreen', () => ({
  useWelcomeOnboardingScreen: () => ({
    handleStart: mockHandleStart,
    handleSkip: mockHandleSkip,
  }),
}));

// eslint-disable-next-line import/first
import WelcomeOnboardingScreen from '../WelcomeOnboardingScreen';

beforeEach(() => {
  mockHandleStart.mockClear();
  mockHandleSkip.mockClear();
});

describe('WelcomeOnboardingScreen', () => {
  it('starts the tour on the big green button', () => {
    render(<WelcomeOnboardingScreen />);

    fireEvent.press(screen.getByText('Start'));

    expect(mockHandleStart).toHaveBeenCalledTimes(1);
  });

  it('offers a way out via the circled X, for anyone who does not want the tour', () => {
    render(<WelcomeOnboardingScreen />);

    fireEvent.press(screen.getByLabelText('Skip the tour'));

    expect(mockHandleSkip).toHaveBeenCalledTimes(1);
  });
});
