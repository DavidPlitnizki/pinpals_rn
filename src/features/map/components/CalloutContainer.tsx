import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CalloutPlacement } from '../hooks/useCalloutAnchor';

interface Props {
  placement: CalloutPlacement;
  // Height of the pin the callout belongs to — the spacer clears exactly this much so the
  // card lands just off the pin's tip rather than floating above it.
  pinHeight: number;
  children: React.ReactNode;
}

// Breathing room between the pin's tip and the card. Small on purpose: the point of the
// callout is to read as attached to its pin.
const GAP = 6;

// The callout's anchor puts its own edge exactly on the pin's coordinate; this adds a
// transparent spacer on whichever side the pin is, so the visible card clears the pin by a
// constant number of pixels no matter how tall the card itself is. The spacer must not take
// touches — it sits directly over the pin, which still has to be tappable.
export function CalloutContainer({ placement, pinHeight, children }: Props) {
  const spacerStyle = useMemo(() => ({ height: pinHeight + GAP }), [pinHeight]);

  return (
    <View style={styles.column}>
      {placement === 'below' && <View style={spacerStyle} pointerEvents="none" />}
      {children}
      {placement === 'above' && <View style={spacerStyle} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
  },
});
