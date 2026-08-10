import { Coordinates } from '../models/types';

export interface CurrentWeather {
  temperatureC: number;
  // WMO weather code (https://open-meteo.com/en/docs) — mapped to an icon by the caller.
  weatherCode: number;
  windSpeedKmh: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  pressureHpa: number;
  precipitationMm: number;
}

export interface HourlyWeatherPoint {
  time: string; // ISO, local to the queried location (timezone=auto)
  temperatureC: number;
  weatherCode: number;
  windSpeedKmh: number;
}

export interface DailyWeatherPoint {
  date: string; // ISO date, local to the queried location
  weatherCode: number;
  tempMinC: number;
  tempMaxC: number;
  sunset: string; // ISO datetime, local to the queried location
}

export interface GeocodedPlace {
  id: number;
  name: string;
  country?: string;
  admin1?: string; // region/state, when present
  coordinates: Coordinates;
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Open-Meteo: free, no API key, no signup for non-commercial use (up to 10k calls/day) —
// see https://open-meteo.com/en/pricing. Revisit (paid plan, ~$29/mo) once the app actually
// has a paywall live, since their free tier's terms only cover non-commercial use.
export async function fetchCurrentWeather(coords: Coordinates): Promise<CurrentWeather | null> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toFixed(4),
    longitude: coords.longitude.toFixed(4),
    current:
      'temperature_2m,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m,surface_pressure,precipitation',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  });

  const url = `${FORECAST_URL}?${params.toString()}`;
  console.log('[weather] current request →', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[weather] current response ← error', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        apparent_temperature?: number;
        relative_humidity_2m?: number;
        surface_pressure?: number;
        precipitation?: number;
      };
    };
    console.log('[weather] current response ←', JSON.stringify(data));

    const {
      temperature_2m: temperatureC,
      weather_code: weatherCode,
      wind_speed_10m: windSpeedKmh,
      apparent_temperature: apparentTemperatureC,
      relative_humidity_2m: humidityPercent,
      surface_pressure: pressureHpa,
      precipitation: precipitationMm,
    } = data.current ?? {};
    if (
      temperatureC == null ||
      weatherCode == null ||
      windSpeedKmh == null ||
      apparentTemperatureC == null ||
      humidityPercent == null ||
      pressureHpa == null ||
      precipitationMm == null
    ) {
      return null;
    }

    return {
      temperatureC,
      weatherCode,
      windSpeedKmh,
      apparentTemperatureC,
      humidityPercent,
      pressureHpa,
      precipitationMm,
    };
  } catch (err) {
    console.log('[weather] current request failed', err);
    return null;
  }
}

// 10-day outlook — the weather detail screen's vertical daily list (low/high + condition icon,
// no hourly breakdown). Also carries each day's sunset for the mini info-card row.
export async function fetchDailyWeather(coords: Coordinates): Promise<DailyWeatherPoint[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toFixed(4),
    longitude: coords.longitude.toFixed(4),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunset',
    temperature_unit: 'celsius',
    forecast_days: '10',
    timezone: 'auto',
  });

  const url = `${FORECAST_URL}?${params.toString()}`;
  console.log('[weather] daily request →', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[weather] daily response ← error', response.status, await response.text());
      return [];
    }

    const data = (await response.json()) as {
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        sunset?: string[];
      };
    };
    console.log('[weather] daily response ←', JSON.stringify(data));

    const { time, weather_code, temperature_2m_max, temperature_2m_min, sunset } =
      data.daily ?? {};
    if (!time || !weather_code || !temperature_2m_max || !temperature_2m_min || !sunset) {
      return [];
    }

    return time.map((date, i) => ({
      date,
      weatherCode: weather_code[i],
      tempMaxC: temperature_2m_max[i],
      tempMinC: temperature_2m_min[i],
      sunset: sunset[i],
    }));
  } catch (err) {
    console.log('[weather] daily request failed', err);
    return [];
  }
}

// Next ~48h, one point per hour — the weather detail screen's hourly strip + wind speed.
export async function fetchHourlyWeather(coords: Coordinates): Promise<HourlyWeatherPoint[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toFixed(4),
    longitude: coords.longitude.toFixed(4),
    hourly: 'temperature_2m,weather_code,wind_speed_10m',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    forecast_days: '2',
    timezone: 'auto',
  });

  const url = `${FORECAST_URL}?${params.toString()}`;
  console.log('[weather] hourly request →', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[weather] hourly response ← error', response.status, await response.text());
      return [];
    }

    const data = (await response.json()) as {
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        weather_code?: number[];
        wind_speed_10m?: number[];
      };
    };
    console.log('[weather] hourly response ←', JSON.stringify(data));

    const { time, temperature_2m, weather_code, wind_speed_10m } = data.hourly ?? {};
    if (!time || !temperature_2m || !weather_code || !wind_speed_10m) return [];

    return time.map((t, i) => ({
      time: t,
      temperatureC: temperature_2m[i],
      weatherCode: weather_code[i],
      windSpeedKmh: wind_speed_10m[i],
    }));
  } catch (err) {
    console.log('[weather] hourly request failed', err);
    return [];
  }
}

// City/country lookup for the weather screen's search field — same free Open-Meteo family
// as the forecast endpoint, no separate vendor/key to manage.
export async function geocodeLocation(query: string): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const url = `${GEOCODING_URL}?${params.toString()}`;
  console.log('[weather] geocode request →', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[weather] geocode response ← error', response.status, await response.text());
      return [];
    }

    const data = (await response.json()) as {
      results?: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
      }[];
    };
    console.log('[weather] geocode response ←', JSON.stringify(data));

    return (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      coordinates: { latitude: r.latitude, longitude: r.longitude },
    }));
  } catch (err) {
    console.log('[weather] geocode request failed', err);
    return [];
  }
}
