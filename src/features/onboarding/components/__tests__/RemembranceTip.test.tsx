import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { ONBOARDING_LABEL } from '../../steps';
import { RemembranceTip } from '../RemembranceTip';

const noop = () => {};

describe('RemembranceTip', () => {
  it('says where the place just saved has gone, and that this is the tour talking', () => {
    render(<RemembranceTip onFinish={noop} />);

    expect(screen.getByText('Your memories live here')).toBeTruthy();
    expect(screen.getByText(ONBOARDING_LABEL.toUpperCase())).toBeTruthy();
    // The last of the tour's five hints.
    expect(screen.getByText('5/5')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByProps({ name: 'arrow-down' })).toHaveLength(1);
  });

  it('ends the tour only when Finish is pressed', () => {
    const onFinish = jest.fn();
    render(<RemembranceTip onFinish={onFinish} />);

    fireEvent.press(screen.getByText('Finish'));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('leaves the tab it points at reachable', () => {
    render(<RemembranceTip onFinish={noop} />);

    // Everything outside the bubble has to let presses through: going to look at the tab
    // before pressing Finish is allowed, and a full-width overlay would swallow that tap.
    const [outermost] = screen.UNSAFE_getAllByType(View);

    expect(outermost.props.pointerEvents).toBe('box-none');
  });
});
