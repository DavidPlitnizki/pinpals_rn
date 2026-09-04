import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'expo-image';

import { QuickAddMemoryPanel, QuickAddMemorySummary } from '../QuickAddMemoryPanel';

const noop = () => {};

describe('QuickAddMemoryPanel', () => {
  it('will not attach an empty memory to the place', () => {
    const onDone = jest.fn();
    render(<QuickAddMemoryPanel draft={null} onDone={onDone} onRemove={noop} onCancel={noop} />);

    fireEvent.press(screen.getByText('Done'));

    // A note with no text, photo, mood or companion says nothing about the visit — attaching
    // one would put an empty card on the place's timeline forever.
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands back a trimmed draft once there is something in it', () => {
    const onDone = jest.fn();
    render(<QuickAddMemoryPanel draft={null} onDone={onDone} onRemove={noop} onCancel={noop} />);

    fireEvent.changeText(screen.getByPlaceholderText('What happened here?'), '  First coffee  ');
    fireEvent.press(screen.getByText('Done'));

    expect(onDone).toHaveBeenCalledWith({
      text: 'First coffee',
      photoUris: [],
      mood: undefined,
      companions: [],
    });
  });

  it('reopens on the draft already attached rather than on a blank form', () => {
    const onDone = jest.fn();
    render(
      <QuickAddMemoryPanel
        draft={{ text: 'Rainy afternoon', photoUris: [], mood: 'calm', companions: ['Ada'] }}
        onDone={onDone}
        onRemove={noop}
        onCancel={noop}
      />,
    );

    expect(screen.getByDisplayValue('Rainy afternoon')).toBeTruthy();
    // Only an already-attached memory can be removed, so the row is absent when composing.
    expect(screen.getByText('Remove memory')).toBeTruthy();
  });

  it('offers nothing to remove while composing a new memory', () => {
    render(<QuickAddMemoryPanel draft={null} onDone={noop} onRemove={noop} onCancel={noop} />);

    expect(screen.queryByText('Remove memory')).toBeNull();
  });
});

describe('QuickAddMemorySummary', () => {
  function photoUris() {
    return screen.UNSAFE_queryAllByType(Image).map((node) => node.props.source?.uri);
  }

  it('sums up what is attached so the place form does not have to be reopened to check', () => {
    render(
      <QuickAddMemorySummary
        draft={{
          text: 'First coffee',
          photoUris: ['file://a.jpg', 'file://b.jpg'],
          mood: 'happy',
          companions: ['Ada', 'Grace'],
        }}
        onEdit={noop}
      />,
    );

    expect(screen.getByText('First coffee')).toBeTruthy();
    expect(screen.getByText(/with Ada, Grace/)).toBeTruthy();
    // The photos themselves, not a count of them: "2 photos" gives the user no way to tell
    // which two they picked.
    expect(photoUris()).toEqual(['file://a.jpg', 'file://b.jpg']);
  });

  it('shows a few photos and counts the rest rather than growing without limit', () => {
    render(
      <QuickAddMemorySummary
        draft={{
          text: 'A long day',
          photoUris: ['file://a.jpg', 'file://b.jpg', 'file://c.jpg', 'file://d.jpg'],
          companions: [],
        }}
        onEdit={noop}
      />,
    );

    expect(photoUris()).toHaveLength(3);
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('still reads as a memory when it holds only a photo', () => {
    render(
      <QuickAddMemorySummary
        draft={{ text: '', photoUris: ['file://a.jpg'], companions: [] }}
        onEdit={noop}
      />,
    );

    expect(screen.getByText('Memory attached')).toBeTruthy();
    expect(photoUris()).toEqual(['file://a.jpg']);
  });
});
