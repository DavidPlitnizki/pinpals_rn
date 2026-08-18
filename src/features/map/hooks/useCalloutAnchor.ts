import { MapView } from '@rnmapbox/maps';
import { RefObject, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

import { Coordinates } from '../../../models/types';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Roughly half a callout's width — how much horizontal room it needs on the side it opens
// towards before it would run off the screen.
const HORIZONTAL_MARGIN = 130;
// A callout opening upwards needs about this much room above the pin; below this line on
// screen there isn't enough, so it flips under the pin instead.
const FLIP_BELOW_Y = WINDOW_HEIGHT * 0.42;

// anchor = the point of the callout that sits on the coordinate, in fractions of its own
// size. y > 1 floats it above the pin, y < 0 hangs it below; x < 0.5 makes it extend to the
// right of the pin, x > 0.5 to the left.
export const CALLOUT_ANCHOR_ABOVE = { x: 0.5, y: 1.4 };
const ANCHOR_Y_BELOW = -0.15;
const ANCHOR_X_OPEN_RIGHT = 0.12;
const ANCHOR_X_OPEN_LEFT = 0.88;

// Keeps an on-map callout inside the screen: it flips below the pin when the pin sits high
// up (no room above), and slides sideways when the pin is near a left/right edge, so the
// callout always lands closer to the middle of the screen instead of being clipped.
export function useCalloutAnchor(
  mapViewRef: RefObject<MapView | null> | undefined,
  coordinates: Coordinates | null | undefined,
): { x: number; y: number } {
  const [anchor, setAnchor] = useState(CALLOUT_ANCHOR_ABOVE);
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;

  useEffect(() => {
    if (latitude == null || longitude == null || !mapViewRef) {
      setAnchor(CALLOUT_ANCHOR_ABOVE);
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      try {
        const point = await mapViewRef.current?.getPointInView([longitude, latitude]);
        if (cancelled || !point) return;
        const [x, y] = point;
        setAnchor({
          x:
            x < HORIZONTAL_MARGIN
              ? ANCHOR_X_OPEN_RIGHT
              : x > WINDOW_WIDTH - HORIZONTAL_MARGIN
                ? ANCHOR_X_OPEN_LEFT
                : CALLOUT_ANCHOR_ABOVE.x,
          y: y < FLIP_BELOW_Y ? ANCHOR_Y_BELOW : CALLOUT_ANCHOR_ABOVE.y,
        });
      } catch {
        // The native map can refuse the query mid-gesture/teardown — the default
        // (above the pin) is a fine fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, mapViewRef]);

  return anchor;
}
