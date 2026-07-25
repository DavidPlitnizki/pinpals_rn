---
name: perf-review
description: Reviews recently added or changed React/React Native code in this repo for correct use of useMemo, useCallback, React.memo, useRef, and other rendering/perf best practices, then applies fixes. Use after writing or editing screens, hooks, or design-system components.
---

# Perf Review (Pinpals RN)

Review the diff (not the whole codebase) for rendering and memoization issues, then fix what's
actually broken — this is not a style pass, only flag things with a real perf or correctness cost.

## Checklist

### useCallback
- Any function passed as a prop to a child that is wrapped in `React.memo` — without
  `useCallback`, the memo is defeated on every parent render.
- Any function passed as a dependency to `useEffect`/`useMemo`/`useCallback` elsewhere, or into a
  Zustand selector/subscription, where recreation would cause a needless re-subscribe or effect
  re-run.
- Don't wrap a function in `useCallback` if it isn't passed anywhere memoization-sensitive — that's
  needless overhead, not an optimization. Flag it as a simplification instead.

### useMemo
- Expensive derived data computed inline in the render body every render: `.filter().map().sort()`
  chains, distance/haversine calculations, aggregations (see
  `useRemembranceScreen.ts`'s `computeStats`/`pickDayMemory` pattern) — these belong behind
  `useMemo` keyed on their real inputs.
- Objects/arrays created inline in JSX and passed as props to a memoized child (defeats the memo
  the same way as an unmemoized callback).
- Don't memoize trivial expressions (`a + b`, a ternary, a single property access) — flag as
  overhead, matching this codebase's existing restraint (see `useMapScreen.ts`, which does NOT
  memoize its simple derived values).

### React.memo
- New presentational/list-item components that re-render on every parent update with unchanged
  props — especially anything rendered inside `.map()` in a list (`MapMarkers`, `PlaceGridCard`,
  timeline items in `PlaceDetailScreen`). Check whether wrapping in `memo` would actually help
  (i.e. the component is non-trivial and its props are referentially stable).
- Verify props passed to a memoized component are actually stable (primitives, or values already
  covered by `useMemo`/`useCallback` above) — `memo` around a component receiving a fresh inline
  object/function every render is a no-op.

### useRef
- Values that change over time but should NOT trigger a re-render when updated (animation driver
  values already correctly use `useRef` + `Animated.Value` in this codebase — match that pattern).
- Mutable "latest value" tracking read inside a callback/effect closure without needing a
  re-render — e.g. `currentCenter`/`currentZoom` in `useMapScreen.ts` is the reference pattern here.
- Flag state that's stored in `useRef` but is actually read during render (should be `useState`
  instead — using a ref there causes stale/inconsistent renders, a correctness bug not just perf).

### Other repo-specific patterns to check
- Zustand selectors: prefer `useStore((s) => s.thing)` (single-field selector) over destructuring
  the whole store when only a slice is needed — the whole-store form re-renders on every store
  change. Existing code favors selectors (see `MapMarkers.tsx`'s `usePlacesStore((s) => s.notes)`).
- Hooks in `features/*/hooks/useXxxScreen.ts` must stay pure logic — no JSX, no SwiftUI/UI imports
  per project convention; don't let a "perf fix" leak UI concerns into a hook.
- `FlatList`/`ScrollView` with `.map()` over potentially large arrays (places, notes) — flag if a
  list could grow large and would benefit from `FlatList` virtualization instead of `ScrollView` +
  `.map()`.

## How to apply

1. Look only at files touched in the current change (`git diff` if unsure of scope).
2. For each hit above, confirm it's a real issue (defeated memoization, unstable prop reference,
   wasted recomputation) — not a hypothetical one.
3. Fix directly rather than just flagging, unless the fix would require a larger refactor the user
   hasn't asked for — in that case, describe the tradeoff and ask.
4. Re-run `npm run typecheck` and `npm run lint` after changes.
