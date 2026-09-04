import type * as StoreReviewModule from 'expo-store-review';

import { reportError } from './crashReporting';

// Required lazily, and never with a static import. expo-store-review resolves its native module
// at import time through `requireNativeModule`, which THROWS when the module is not in the
// binary (e.g. before this dev client has been rebuilt with it as a dependency) — a static
// import would crash any screen that pulls this file in, before anything could catch it. See
// services/contacts.ts, which hit exactly this and documents it at more length.
let cachedModule: typeof StoreReviewModule | null | undefined;

function loadStoreReview(): typeof StoreReviewModule | null {
  if (cachedModule !== undefined) return cachedModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-store-review') as typeof StoreReviewModule;
  } catch (err) {
    reportError('storeReview', err, 'expo-store-review is not linked into this build');
    cachedModule = null;
  }

  return cachedModule;
}

// Best-effort and silent either way: a rating prompt is a nice-to-have, never worth surfacing
// an error over. Apple also throttles how often its native prompt can actually appear (about
// three times a year per app, per device) — most calls to this are expected to do nothing
// visible on the OS side, which is normal, not a failure.
export async function requestStoreReview(): Promise<void> {
  const storeReview = loadStoreReview();
  if (!storeReview) return;

  try {
    if (await storeReview.isAvailableAsync()) {
      await storeReview.requestReview();
    }
  } catch (err) {
    reportError('storeReview', err, 'requesting a store review failed');
  }
}

// Tests only: the module handle is cached for the life of the process, and each case needs its
// own verdict on whether expo-store-review is linked.
export function resetStoreReviewModuleCacheForTests(): void {
  cachedModule = undefined;
}
