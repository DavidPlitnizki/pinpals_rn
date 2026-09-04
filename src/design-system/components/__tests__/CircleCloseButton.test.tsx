import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CircleCloseButton } from '../CircleCloseButton';

describe('CircleCloseButton', () => {
  it('reads as "Close" by default — right everywhere this dismisses something', () => {
    render(<CircleCloseButton onPress={() => {}} />);

    expect(screen.getByLabelText('Close')).toBeTruthy();
  });

  it('lets a caller say what it actually does, when it is not a plain close', () => {
    const onPress = jest.fn();
    render(<CircleCloseButton onPress={onPress} accessibilityLabel="Skip the tour" />);

    fireEvent.press(screen.getByLabelText('Skip the tour'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Close')).toBeNull();
  });
});
