import { PointAnnotation } from '@rnmapbox/maps';
import { useCallback, useEffect, useRef } from 'react';

// @rnmapbox/maps renders PointAnnotation content as a one-time native bitmap snapshot
// (captured once when the annotation is first added, see RNMBXPointAnnotation.swift's
// insertReactSubviewInternal/_createViewSnapshot) rather than a live view. Presenting a
// full-screen Modal over the MapView (even a `transparent` one, like RouteModePicker) can
// silently drop that snapshot on iOS, leaving the marker invisible even though it's still
// mounted in React. Re-running `refresh()` re-captures the current view and re-registers
// the image, so call this once whenever `signal` changes (e.g. when a Modal closes).
export function usePointAnnotationRefresh(signal: unknown) {
  const refs = useRef(new Map<string, PointAnnotation | null>());
  const setters = useRef(new Map<string, (ref: PointAnnotation | null) => void>());

  useEffect(() => {
    // Deferred one frame: this effect can fire in the very same commit that just mounted a
    // brand new PointAnnotation (e.g. a place added while `signal` also changes), and asking
    // a native view to snapshot itself before it has completed its first native layout/paint
    // pass captures nothing — the marker silently never appears. A frame's grace lets that
    // first paint land first.
    const frame = requestAnimationFrame(() => {
      refs.current.forEach((ref) => ref?.refresh());
    });
    return () => cancelAnimationFrame(frame);
  }, [signal]);

  // The ref callback must keep the same identity across renders. Returning a fresh arrow
  // each time made React detach (call with null) and re-attach every annotation's ref on
  // every single map render — pointless churn on a view tree that sits in the main window
  // underneath the modal forms. Cached per id instead.
  const registerRef = useCallback(function registerRef(id: string) {
    let setter = setters.current.get(id);
    if (!setter) {
      setter = (ref: PointAnnotation | null) => {
        refs.current.set(id, ref);
      };
      setters.current.set(id, setter);
    }
    return setter;
  }, []);

  // For content that finishes loading asynchronously well after mount (e.g. a photo thumbnail
  // decoding from disk) — the effect above only re-snapshots on `signal` changes, which won't
  // happen just because an image inside one marker finished loading on its own schedule.
  const refreshOne = useCallback((id: string) => {
    refs.current.get(id)?.refresh();
  }, []);

  return { registerRef, refreshOne };
}
