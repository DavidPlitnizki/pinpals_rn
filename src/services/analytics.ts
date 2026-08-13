import { getAnalytics, logEvent, setUserId, setUserProperty } from '@react-native-firebase/analytics';

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
  void logEvent(getAnalytics(), 'place_filter_used', { filter_type: filterType, value: value ?? '' });
}

export type SearchSource = 'map_pin' | 'search_result' | 'native_poi';

export function logExternalSearchOpened(source: SearchSource): void {
  void logEvent(getAnalytics(), 'external_search_opened', { source });
}
