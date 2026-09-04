import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockStop = jest.fn(() => Promise.resolve());
const mockGoToNext = jest.fn(() => Promise.resolve());
const mockCopilot: { currentStep: { name: string; text: string } | undefined } = {
  currentStep: undefined,
};

jest.mock('react-native-copilot', () => ({
  useCopilot: () => ({
    currentStep: mockCopilot.currentStep,
    goToNext: mockGoToNext,
    isLastStep: true,
    stop: mockStop,
  }),
}));

// eslint-disable-next-line import/first
import { OnboardingTooltip } from '../OnboardingTooltip';
// eslint-disable-next-line import/first
import { MAP_TIP_STEP, ONBOARDING_LABEL, SAVE_TIP_STEP } from '../../steps';
// eslint-disable-next-line import/first
import { useOnboardingStore } from '../../../../store/useOnboardingStore';

const LABELS = { finish: 'Got it', skip: 'Skip', next: 'Next', previous: 'Back' };

function renderTooltip(stepName: string) {
  mockCopilot.currentStep = { name: stepName, text: 'Body copy' };
  return render(<OnboardingTooltip labels={LABELS} />);
}

beforeEach(() => {
  mockStop.mockClear();
  useOnboardingStore.setState({ stage: 'map-tip', hydrated: true });
});

describe('OnboardingTooltip', () => {
  it('marks itself as part of the tour', () => {
    renderTooltip(MAP_TIP_STEP);

    // Without this a first-time user has no way to tell a hint from the app's own chrome.
    expect(screen.getByText(ONBOARDING_LABEL.toUpperCase())).toBeTruthy();
  });

  it('offers a way out of the whole tour on the very first hint', () => {
    renderTooltip(MAP_TIP_STEP);

    fireEvent.press(screen.getByText('Skip'));

    // Copilot's own cursor knows nothing about the later steps, which live in the stage — so
    // skipping has to end them all, not just close this one.
    expect(useOnboardingStore.getState().stage).toBe('done');
    expect(mockStop).toHaveBeenCalled();
  });

  it('does not offer to skip once the user is already following along', () => {
    renderTooltip(SAVE_TIP_STEP);

    // By this point the user has opened a card of their own accord; "skip the tour" is no
    // longer the question being asked.
    expect(screen.queryByText('Skip')).toBeNull();
    expect(screen.getByText('Got it')).toBeTruthy();
  });
});
