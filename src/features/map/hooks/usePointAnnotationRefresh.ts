import { PointAnnotation } from '@rnmapbox/maps';
import { useEffect, useRef } from 'react';

// @rnmapbox/maps renders PointAnnotation content as a one-time native bitmap snapshot
// (captured once when the annotation is first added, see RNMBXPointAnnotation.swift's
// insertReactSubviewInternal/_createViewSnapshot) rather than a live view. Presenting a
// full-screen Modal over the MapView (even a `transparent` one, like RouteModePicker) can
// silently drop that snapshot on iOS, leaving the marker invisible even though it's still
// mounted in React. Re-running `refresh()` re-captures the current view and re-registers
// the image, so call this once whenever `signal` changes (e.g. when a Modal closes).
export function usePointAnnotationRefresh(signal: unknown) {
  const refs = useRef(new Map<string, PointAnnotation | null>());

  useEffect(() => {
    refs.current.forEach((ref) => ref?.refresh());
  }, [signal]);

  return function registerRef(id: string) {
    return (ref: PointAnnotation | null) => {
      refs.current.set(id, ref);
    };
  };
}
