# Stage Touch Gestures & Quick Pinch to Fit

## Overview

The proofing stage (`#stageViewport`) supports zero-jitter native touch navigation across all editor modes (`Pan`, `Parts`, `Step`, `Camera`, `Page`), including Procreate-style **Quick Pinch to Fit** ("pinch to fill") so touch users can snap a zoomed or panned manual page back to centered 100% viewport fit with a single brisk two-finger inward pinch.

## Gesture Behavior

### Live Two-Finger Pinch & Pan
- Placing two fingers on `#stageViewport` enters `'pinch'` mode regardless of the active bottom-dock mode.
- The page tracks finger separation and midpoint live via `translate3d` + `scale` on `#stageContainer`.
- Starting a two-finger pinch clears any pending double-tap timestamp and cancels any active snap-back animation.

### Procreate Quick Pinch to Fit
When a two-finger pinch ends (`touchend` reduces active touches below 2 — `touchcancel` never triggers a fit):

1. **Standard Quick Pinch** (total pinch duration ≤ `360 ms`):
   - Finger separation shrinks by at least `32 px` and ends at ≤ `80%` of the starting span (`endDist / startDist <= 0.80`).
   - Closing velocity over active inward motion is ≥ `0.25 px/ms`.
   - Trailing pause after the last inward movement is ≤ `130 ms` (holding still to inspect framing cancels the snap).
   - Outward rebound from the tightest finger separation is ≤ `8 px` (reversing to fine-tune zoom cancels the snap).

2. **Mid-Gesture Inward Flick** (after a longer two-finger pan/zoom > `360 ms`):
   - Within the trailing `180 ms` window, finger separation contracts by at least `48 px` with ratio ≤ `0.72` and velocity ≥ `0.45 px/ms`.
   - Trailing pause is ≤ `110 ms` and outward rebound is ≤ `8 px`.

3. **Staggered Finger Lift Guard**:
   - Because fingers rarely lift on the exact same millisecond, triggering Quick Pinch to Fit enters a temporary `'pinch-fitted'` state until all touches lift (`touches.length === 0`), preventing the remaining finger from immediately starting a single-finger pan that would cancel the snap animation.

### Animated Snap-to-Fit
- Triggering Quick Pinch to Fit (or double-tapping in Pan mode) runs `animateResetZoom()` over `220 ms` with a cubic ease-out (`easeOutCubic`) back to `{ zoom: 1, panX: 0, panY: 0 }`.
- Respects `prefers-reduced-motion: reduce` by snapping immediately.
- Any new user input (`wheel`, `touchstart`, `mousedown`, `setZoom`, `resetZoom`) immediately cancels the in-flight animation.

## Implementation
- Pure gesture classifier & interpolation helpers: [`src/engine/stageGestures.ts`](../src/engine/stageGestures.ts)
- Unit tests: [`src/engine/__tests__/stageGestures.test.ts`](../src/engine/__tests__/stageGestures.test.ts)
- Stage runtime integration: [`src/studioRuntime.ts`](../src/studioRuntime.ts) (`animateResetZoom`, `setupStageGestures`)
