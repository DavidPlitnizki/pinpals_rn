import { IconName } from './mapboxIcons';

// WMO weather codes (https://open-meteo.com/en/docs), collapsed to the handful of icons the
// glance badge actually shows — not a full forecast UI, so exact code granularity doesn't matter.
export function iconForWeatherCode(code: number): IconName {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly-sunny';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'partly-sunny';
}

// Matching tint per condition so weather icons read at a glance instead of all sharing one
// brand-green color — used everywhere iconForWeatherCode is (map badge, hourly/daily lists).
export function colorForWeatherCode(code: number): string {
  if (code === 0) return '#F5A623';
  if (code === 1 || code === 2) return '#F5C518';
  if (code === 3) return '#8B9DAF';
  if (code === 45 || code === 48) return '#B0B8BF';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '#3D9BE9';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '#7EC8E3';
  if (code >= 95) return '#6C63FF';
  return '#F5C518';
}
