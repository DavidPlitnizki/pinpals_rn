import { render, screen } from '@testing-library/react-native';
import React from 'react';

const mockStop = jest.fn(() => Promise.resolve());
const mockGoToNext = jest.fn(() => Promise.resolve());
const mockCopilot: {
  currentStep: { name: string; text: string } | undefined;
  isLastStep: boolean;
} = {
  currentStep: undefined,
  isLastStep: true,
};

jest.mock('react-native-copilot', () => ({
  useCopilot: () => ({
    currentStep: mockCopilot.currentStep,
    goToNext: mockGoToNext,
    isLastStep: mockCopilot.isLastStep,
    stop: mockStop,
  }),
}));

// eslint-disable-next-line import/first
import { OnboardingTooltip } from '../OnboardingTooltip';
// eslint-disable-next-line import/first
import { MAP_TIP_STEP, ONBOARDING_LABEL, SAVE_TIP_STEP } from '../../steps';

const LABELS = { finish: 'Got it', skip: 'Skip', next: 'Next', previous: 'Back' };

function renderTooltip(stepName: string, isLastStep = true) {
  mockCopilot.currentStep = { name: stepName, text: 'Body copy' };
  mockCopilot.isLastStep = isLastStep;
  return render(<OnboardingTooltip labels={LABELS} />);
}

beforeEach(() => {
  mockStop.mockClear();
  mockGoToNext.mockClear();
});

describe('OnboardingTooltip', () => {
  it('marks itself as part of the tour', () => {
    renderTooltip(MAP_TIP_STEP);

    // Without this a first-time user has no way to tell a hint from the app's own chrome.
    expect(screen.getByText(ONBOARDING_LABEL.toUpperCase())).toBeTruthy();
  });

  it('offers no way to skip the whole tour — that lives on the welcome screen now', () => {
    renderTooltip(MAP_TIP_STEP);

    // A stray Skip here would need to reach into the persisted stage the same way the old one
    // did; simplest is to not offer it a second time at all.
    expect(screen.queryByText('Skip')).toBeNull();
    expect(screen.getByText('Got it')).toBeTruthy();
  });

  it('shows the map hint as the first of five', () => {
    renderTooltip(MAP_TIP_STEP);

    expect(screen.getByText('1/5')).toBeTruthy();
  });

  it('shows the save hint as the second of five', () => {
    renderTooltip(SAVE_TIP_STEP, false);

    expect(screen.getByText('2/5')).toBeTruthy();
    // Not the last step, so the primary button reads "Next", not "Got it".
    expect(screen.getByText('Next')).toBeTruthy();
  });
});
