import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperty,
} from '@react-native-firebase/analytics';

// Bucketed rather than the raw number — Firebase user properties are for segmentation
// (e.g. "compare retention of 0-place vs 20+-place users" in the dashboard), and a
// high-cardinality raw count isn't useful there. The raw count is still visible per-user
// in `place_created`/`place_deleted` event params for anyone querying via BigQuery export.
function placesCountBucket(count: number): string {
  if (count === 0) return '0';
  if (count <= 5) return '1-5';
  if (count <= 20) return '6-20';
  if (count <= 50) return '21-50';
  return '50+';
}

export function setAnalyticsUserId(uid: string | null): void {
  void setUserId(getAnalytics(), uid);
}

export function setAnalyticsUserProperty(name: string, value: string | null): void {
  void setUserProperty(getAnalytics(), name, value);
}

export function setPlacesCount(count: number): void {
  void logEvent(getAnalytics(), 'places_count_changed', { count });
  void setUserProperty(getAnalytics(), 'places_count_bucket', placesCountBucket(count));
}

export type FilterType = 'tag' | 'mood' | 'period' | 'want_to_visit' | 'sort';

export function logFilterUsed(filterType: FilterType, value?: string): void {
  void logEvent(getAnalytics(), 'place_filter_used', {
    filter_type: filterType,
    value: value ?? '',
  });
}

// Every Mapbox call that costs money, by the unit Mapbox actually bills:
//
//   search_session   one suggest→retrieve autocomplete session (billed per session, however
//                    many keystrokes it took)
//   search_forward   one Search Box forward request (category chips, fly-to, POI enrichment)
//   geocode_reverse  one Geocoding reverse request
//   static_image     one Static Images render (place cover art)
//
// Logged per call so usage is attributable to a user in Firebase rather than only visible as
// a total on the Mapbox invoice — that's the difference between "we're over budget" and
// "we're over budget because of this behaviour".
export type MapboxBillableUnit =
  'search_session' | 'search_forward' | 'geocode_reverse' | 'static_image';

export function logMapboxUsage(unit: MapboxBillableUnit): void {
  void logEvent(getAnalytics(), 'mapbox_usage', { unit });
}

export type SearchSource = 'map_pin' | 'search_result' | 'native_poi';

export function logExternalSearchOpened(source: SearchSource): void {
  void logEvent(getAnalytics(), 'external_search_opened', { source });
}

// There's no "share a meeting" action yet (meetings have no participants/invite flow until
// Phase 2 — see PRODUCT.md) — sharing a place or a route via the native share sheet is the
// closest thing this app has to an invite today, so these stand in for share/invite rate
// until a real meeting_shared event exists.
export function logPlaceShared(): void {
  void logEvent(getAnalytics(), 'place_shared');
}

export function logRouteShared(): void {
  void logEvent(getAnalytics(), 'route_shared');
}

// ── Acquisition channel ("who comes in through what") ──────────────────────────

export type LoginMethod = 'google.com' | 'apple.com' | 'anonymous';

// Firebase's own recommended event for "how did this user get into a logged-in state" —
// fired once per explicit sign-in action (not on every app cold start / restored session),
// so event volume broken down by `method` in the Firebase console directly answers
// "through what channel do people come in".
export function logLogin(method: LoginMethod): void {
  void logEvent(getAnalytics(), 'login', { method });
}

// ── Return frequency ("how often do they come back") ───────────────────────────

const SESSION_COUNT_KEY = 'pinpals-analytics-session-count';
const FIRST_OPEN_KEY = 'pinpals-analytics-first-open-date';

function daysSinceBucket(days: number): string {
  if (days === 0) return 'day_0';
  if (days <= 1) return 'day_1';
  if (days <= 7) return 'week_1';
  if (days <= 30) return 'month_1';
  return 'month_1+';
}

function sessionCountBucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 10) return '4-10';
  if (count <= 30) return '11-30';
  return '30+';
}

// Firebase auto-computes Day 1/7/30 retention cohorts from `first_open`/`app_open`, which
// needs no code here — but that only shows aggregate cohort charts, not a queryable
// per-user "how many times has this person opened the app" figure. This adds that: a
// persisted launch counter plus days-since-first-open, both logged as an event (for
// BigQuery-style per-session analysis) and as user properties (for segmenting every other
// event by how much of a regular this user is). Call once per cold start.
export async function trackAppOpen(): Promise<void> {
  const now = Date.now();
  const [countRaw, firstOpenRaw] = await Promise.all([
    AsyncStorage.getItem(SESSION_COUNT_KEY),
    AsyncStorage.getItem(FIRST_OPEN_KEY),
  ]);

  const sessionCount = (countRaw ? parseInt(countRaw, 10) : 0) + 1;
  const firstOpenAt = firstOpenRaw ? parseInt(firstOpenRaw, 10) : now;

  await Promise.all([
    AsyncStorage.setItem(SESSION_COUNT_KEY, String(sessionCount)),
    firstOpenRaw ? Promise.resolve() : AsyncStorage.setItem(FIRST_OPEN_KEY, String(now)),
  ]);

  const daysSinceFirstOpen = Math.floor((now - firstOpenAt) / 86_400_000);

  void logEvent(getAnalytics(), 'app_session_start', {
    session_count: sessionCount,
    days_since_first_open: daysSinceFirstOpen,
  });
  void setUserProperty(getAnalytics(), 'session_count_bucket', sessionCountBucket(sessionCount));
  void setUserProperty(
    getAnalytics(),
    'days_since_first_open',
    daysSinceBucket(daysSinceFirstOpen),
  );
}
