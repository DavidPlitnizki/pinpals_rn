import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '../../design-system/tokens';
import { DailyWeatherPoint, GeocodedPlace, HourlyWeatherPoint } from '../../services/weather';
import { colorForWeatherCode, iconForWeatherCode } from '../map/utils/weatherIcons';
import { MIN_SEARCH_QUERY_LENGTH, useWeatherDetailScreen } from './hooks/useWeatherDetailScreen';

interface ResultRowProps {
  place: GeocodedPlace;
  onSelect: (place: GeocodedPlace) => void;
}

const SearchResultRow = React.memo(function SearchResultRow({ place, onSelect }: ResultRowProps) {
  const handlePress = useCallback(() => onSelect(place), [onSelect, place]);
  return (
    <TouchableOpacity style={styles.resultRow} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name="location-outline" size={18} color={Colors.brand.primary} />
      <Text style={styles.resultText} numberOfLines={1}>
        {[place.name, place.admin1, place.country].filter(Boolean).join(', ')}
      </Text>
    </TouchableOpacity>
  );
});

interface HourItemProps {
  point: HourlyWeatherPoint;
}

const HourItem = React.memo(function HourItem({ point }: HourItemProps) {
  return (
    <View style={styles.hourItem}>
      <Text style={styles.hourLabel}>{point.time.slice(11, 16)}</Text>
      <Ionicons
        name={iconForWeatherCode(point.weatherCode)}
        size={22}
        color={colorForWeatherCode(point.weatherCode)}
      />
      <Text style={styles.hourTemp}>{Math.round(point.temperatureC)}°</Text>
    </View>
  );
});

interface MiniInfoCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
}

const MiniInfoCard = React.memo(function MiniInfoCard({
  icon,
  iconColor,
  label,
  value,
}: MiniInfoCardProps) {
  return (
    <View style={styles.miniCard}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.miniCardLabel}>{label}</Text>
      <Text style={styles.miniCardValue}>{value}</Text>
    </View>
  );
});

// day-of-week formatting from a date-only ISO string ("2026-08-09") — parsed from its y/m/d
// parts directly rather than `new Date(dateString)`, which JS interprets as UTC midnight and
// can shift a day in either direction once converted to the device's local timezone.
function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
}

interface DayRowProps {
  point: DailyWeatherPoint;
  index: number;
  rangeMinC: number;
  rangeMaxC: number;
  currentTempC: number | null;
}

const DayRow = React.memo(function DayRow({
  point,
  index,
  rangeMinC,
  rangeMaxC,
  currentTempC,
}: DayRowProps) {
  const span = rangeMaxC - rangeMinC || 1;
  const leftPct = ((point.tempMinC - rangeMinC) / span) * 100;
  const widthPct = ((point.tempMaxC - point.tempMinC) / span) * 100;
  const showMarker = index === 0 && currentTempC != null;
  const markerPct = showMarker
    ? Math.min(100, Math.max(0, ((currentTempC! - rangeMinC) / span) * 100))
    : 0;

  return (
    <View style={styles.dayRow}>
      <Text style={styles.dayLabel}>{formatDayLabel(point.date, index)}</Text>
      <Ionicons
        name={iconForWeatherCode(point.weatherCode)}
        size={18}
        color={colorForWeatherCode(point.weatherCode)}
      />
      <Text style={styles.dayTempMin}>{Math.round(point.tempMinC)}°</Text>
      <View style={styles.dayBarTrack}>
        <View
          style={[
            styles.dayBarFill,
            {
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              backgroundColor: colorForWeatherCode(point.weatherCode),
            },
          ]}
        />
        {showMarker && <View style={[styles.dayBarMarker, { left: `${markerPct}%` }]} />}
      </View>
      <Text style={styles.dayTempMax}>{Math.round(point.tempMaxC)}°</Text>
    </View>
  );
});

export default function WeatherDetailScreen() {
  const {
    locationLabel,
    current,
    hourly,
    daily,
    loading,
    query,
    setQuery,
    searchResults,
    searching,
    selectResult,
    close,
  } = useWeatherDetailScreen();

  const showResults = query.trim().length >= MIN_SEARCH_QUERY_LENGTH;

  const rangeMinC = useMemo(
    () => (daily.length ? Math.min(...daily.map((d) => d.tempMinC)) : 0),
    [daily],
  );
  const rangeMaxC = useMemo(
    () => (daily.length ? Math.max(...daily.map((d) => d.tempMaxC)) : 1),
    [daily],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inputWrap}>
        <TouchableOpacity onPress={close} hitSlop={styles.backHitSlop}>
          <Ionicons name="close" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        <Ionicons name="search" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search city or country…"
          placeholderTextColor={Colors.neutral[400]}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {showResults ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <SearchResultRow place={item} onSelect={selectResult} />}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator style={styles.loadingIndicator} color={Colors.brand.primary} />
            ) : (
              <Text style={styles.emptyText}>No matching places</Text>
            )
          }
        />
      ) : loading ? (
        <ActivityIndicator style={styles.loadingIndicator} color={Colors.brand.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.locationLabel}>{locationLabel}</Text>

          {current && (
            <View style={styles.currentRow}>
              <Ionicons
                name={iconForWeatherCode(current.weatherCode)}
                size={56}
                color={colorForWeatherCode(current.weatherCode)}
              />
              <Text style={styles.currentTemp}>{Math.round(current.temperatureC)}°</Text>
            </View>
          )}
          {current && (
            <Text style={styles.feelsLikeText}>
              Feels like {Math.round(current.apparentTemperatureC)}°
            </Text>
          )}

          {current && (
            <View style={styles.miniGrid}>
              <MiniInfoCard
                icon="thermometer-outline"
                iconColor="#E8834A"
                label="Feels like"
                value={`${Math.round(current.apparentTemperatureC)}°`}
              />
              <MiniInfoCard
                icon="flag-outline"
                iconColor="#3D9BE9"
                label="Wind"
                value={`${Math.round(current.windSpeedKmh)} km/h`}
              />
              <MiniInfoCard
                icon="rainy-outline"
                iconColor="#3D9BE9"
                label="Precipitation"
                value={`${current.precipitationMm.toFixed(1)} mm`}
              />
              <MiniInfoCard
                icon="water-outline"
                iconColor="#2AB6A8"
                label="Humidity"
                value={`${Math.round(current.humidityPercent)}%`}
              />
              <MiniInfoCard
                icon="speedometer-outline"
                iconColor="#9C6ADE"
                label="Pressure"
                value={`${Math.round(current.pressureHpa)} hPa`}
              />
              <MiniInfoCard
                icon="sunny-outline"
                iconColor="#F5A623"
                label="Sunset"
                value={daily[0] ? daily[0].sunset.slice(11, 16) : '—'}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>Next 48 hours</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hourly.map((point) => (
              <HourItem key={point.time} point={point} />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>10-day forecast</Text>
          <View style={styles.dayList}>
            {daily.map((point, index) => (
              <DayRow
                key={point.date}
                point={point}
                index={index}
                rangeMinC={rangeMinC}
                rangeMaxC={rangeMaxC}
                currentTempC={current?.temperatureC ?? null}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backHitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.s16,
    marginTop: Spacing.s12,
    marginBottom: Spacing.s12,
    backgroundColor: Colors.neutral[50],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    gap: Spacing.s8,
    borderColor: Colors.brand.primary,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  resultsList: {
    paddingHorizontal: Spacing.s16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingVertical: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  resultText: {
    ...Typography.callout,
    color: Colors.neutral[900],
    flex: 1,
  },
  loadingIndicator: {
    marginTop: Spacing.s24,
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.neutral[400],
    textAlign: 'center',
    paddingVertical: Spacing.s16,
  },
  content: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s24,
    alignItems: 'center',
  },
  locationLabel: {
    ...Typography.title3,
    color: Colors.neutral[900],
    marginBottom: Spacing.s16,
    textAlign: 'center',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  currentTemp: {
    ...Typography.title1,
    color: Colors.neutral[900],
  },
  feelsLikeText: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    marginTop: Spacing.s4,
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.s20,
    gap: Spacing.s8,
  },
  miniCard: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.s4,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s8,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  miniCardLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  miniCardValue: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.neutral[500],
    fontWeight: '700',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: Spacing.s24,
    marginBottom: Spacing.s8,
  },
  hourItem: {
    alignItems: 'center',
    gap: Spacing.s4,
    width: 60,
    paddingVertical: Spacing.s12,
    marginRight: Spacing.s8,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  hourLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  hourTemp: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  dayList: {
    width: '100%',
    gap: Spacing.s8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s12,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dayLabel: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: Colors.neutral[900],
    width: 44,
  },
  dayTempMin: {
    ...Typography.caption,
    color: Colors.neutral[500],
    width: 28,
    textAlign: 'right',
  },
  dayTempMax: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral[900],
    width: 28,
    textAlign: 'right',
  },
  dayBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.neutral[100],
  },
  dayBarFill: {
    position: 'absolute',
    height: 6,
    borderRadius: Radii.full,
  },
  dayBarMarker: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.neutral[900],
    marginLeft: -6,
  },
});
