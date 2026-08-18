import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../tokens';

interface Props {
  date: Date;
  size?: number;
}

const TICK_COUNT = 12;

// Plain-View clock face (no SVG dependency in this project): the ticks and both hands are
// rectangles rotated around the face's centre.
export const AnalogClock = React.memo(function AnalogClock({ date, size = 132 }: Props) {
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;

  const minuteAngle = minutes * 6; // 360 / 60
  const hourAngle = hours * 30 + minutes * 0.5; // 360 / 12, plus the hour hand's drift

  const faceStyle = useMemo(
    () => [styles.face, { width: size, height: size, borderRadius: size / 2 }],
    [size],
  );

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, i) => ({
        key: i,
        style: [
          styles.tick,
          {
            // Full-height column so its centre coincides with the face's centre — rotating
            // it about its own centre then swings the mark at its top around the dial.
            height: size,
            transform: [{ rotate: `${i * (360 / TICK_COUNT)}deg` }],
          },
        ],
        markStyle: [styles.tickMark, i % 3 === 0 && styles.tickMarkMajor],
      })),
    [size],
  );

  const hourHandStyle = useMemo(
    () => [
      styles.hand,
      styles.hourHand,
      {
        height: size * 0.26,
        transform: [{ rotate: `${hourAngle}deg` }, { translateY: -size * 0.13 }],
      },
    ],
    [size, hourAngle],
  );

  const minuteHandStyle = useMemo(
    () => [
      styles.hand,
      styles.minuteHand,
      {
        height: size * 0.36,
        transform: [{ rotate: `${minuteAngle}deg` }, { translateY: -size * 0.18 }],
      },
    ],
    [size, minuteAngle],
  );

  return (
    <View style={faceStyle}>
      {ticks.map((tick) => (
        <View key={tick.key} style={tick.style} pointerEvents="none">
          <View style={tick.markStyle} />
        </View>
      ))}
      <View style={hourHandStyle} />
      <View style={minuteHandStyle} />
      <View style={styles.pivot} />
    </View>
  );
});

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.brand.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  // Each tick is a full-radius column pinned to the centre; rotating the column swings the
  // little mark at its top around the dial.
  tick: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tickMark: {
    width: 2,
    height: 5,
    marginTop: 6,
    borderRadius: 1,
    backgroundColor: Colors.neutral[200],
  },
  tickMarkMajor: {
    width: 3,
    height: 9,
    backgroundColor: Colors.brand.primary,
  },
  hand: {
    position: 'absolute',
    borderRadius: 2,
  },
  hourHand: {
    width: 4,
    backgroundColor: Colors.neutral[900],
  },
  minuteHand: {
    width: 3,
    backgroundColor: Colors.brand.primary,
  },
  pivot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[900],
  },
});
