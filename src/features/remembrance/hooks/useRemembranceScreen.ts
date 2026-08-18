import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { Place, PlaceCategory, PlaceNote } from '../../../models/types';
import { logFilterUsed } from '../../../services/analytics';
import { CATEGORY_LABELS } from '../../../shared/constants';
import { useMeetingsStore } from '../../../store/useMeetingsStore';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { EMPTY_FILTERS, FilterPeriod, PlaceFilters, SortOption, Tab, ViewMode } from '../types';

export interface PlaceStats {
  total: number;
  favCategory: { category: PlaceCategory; label: string; count: number } | null;
  activeMonth: string | null; // e.g. "March"
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function computeStats(places: Place[]): PlaceStats {
  if (places.length === 0) return { total: 0, favCategory: null, activeMonth: null };

  // Favourite category
  const catCount: Partial<Record<PlaceCategory, number>> = {};
  for (const p of places) {
    if (!p.category) continue;
    catCount[p.category] = (catCount[p.category] ?? 0) + 1;
  }
  const topCat = (Object.entries(catCount) as [PlaceCategory, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const favCategory = topCat
    ? { category: topCat[0], label: CATEGORY_LABELS[topCat[0]], count: topCat[1] }
    : null;

  // Most active month (by createdAt)
  const monthCount: Record<number, number> = {};
  for (const p of places) {
    const m = new Date(p.createdAt).getMonth();
    monthCount[m] = (monthCount[m] ?? 0) + 1;
  }
  const topMonth = Object.entries(monthCount).sort((a, b) => b[1] - a[1])[0];
  const activeMonth = topMonth ? MONTH_NAMES[Number(topMonth[0])] : null;

  return { total: places.length, favCategory, activeMonth };
}

export interface DayMemory {
  place: Place;
  note: PlaceNote | null;
  yearsAgo: number;
  label: string; // "1 year ago", "3 years ago", "On this day X years ago"
}

function periodCutoff(period: FilterPeriod): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (period === '3months') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (period === 'year') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return null;
}

function sortPlaces(places: Place[], sortBy: SortOption): Place[] {
  const sorted = [...places];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'mostVisited':
      return sorted.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
    case 'newest':
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function yearsAgoLabel(years: number): string {
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

function pickDayMemory(places: Place[], notes: PlaceNote[]): DayMemory | null {
  if (places.length === 0) return null;

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const todayYear = today.getFullYear();

  // Find places created or visited on the same day/month in a past year
  const sameDay = places
    .map((p) => {
      const d = new Date(p.lastVisited ?? p.createdAt);
      const diffYears = todayYear - d.getFullYear();
      const sameMonthDay = d.getMonth() === todayMonth && d.getDate() === todayDay;
      return { place: p, date: d, diffYears, sameMonthDay };
    })
    .filter((x) => x.sameMonthDay && x.diffYears > 0)
    .sort((a, b) => {
      // Prefer places with notes (memories)
      const aNotes = notes.filter((n) => n.placeId === a.place.id).length;
      const bNotes = notes.filter((n) => n.placeId === b.place.id).length;
      if (bNotes !== aNotes) return bNotes - aNotes;
      // Then prefer older memories
      return b.diffYears - a.diffYears;
    });

  if (sameDay.length > 0) {
    const { place, diffYears } = sameDay[0];
    const placeNotes = notes.filter((n) => n.placeId === place.id);
    const noteWithPhoto = placeNotes.find((n) => n.photoUri ?? (n.photoUris?.length ?? 0) > 0);
    return {
      place,
      note: noteWithPhoto ?? placeNotes[0] ?? null,
      yearsAgo: diffYears,
      label: `On this day ${yearsAgoLabel(diffYears)}`,
    };
  }

  // Fallback: oldest place with notes, or just oldest place
  const withNotes = places.filter((p) => notes.some((n) => n.placeId === p.id));
  const pool = withNotes.length > 0 ? withNotes : places;

  // Deterministic by day-of-year so it stays the same all day
  const dayOfYear = Math.floor((today.getTime() - new Date(todayYear, 0, 0).getTime()) / 86400000);
  const picked = pool[dayOfYear % pool.length];
  const pickedDate = new Date(picked.lastVisited ?? picked.createdAt);
  const diffMs = today.getTime() - pickedDate.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  let label: string;
  if (diffDays < 30) {
    label = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    label = months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    label = yearsAgoLabel(years);
  }

  const placeNotes = notes.filter((n) => n.placeId === picked.id);
  const noteWithPhoto = placeNotes.find((n) => n.photoUri ?? (n.photoUris?.length ?? 0) > 0);

  return {
    place: picked,
    note: noteWithPhoto ?? placeNotes[0] ?? null,
    yearsAgo: Math.floor(diffDays / 365),
    label,
  };
}

export function useRemembranceScreen() {
  const router = useRouter();
  const { places, notes, deletePlace } = usePlacesStore();
  const { meetings } = useMeetingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<PlaceFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [places]);

  const allMoods = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.mood) set.add(n.mood);
    });
    return Array.from(set);
  }, [notes]);

  const activeFilterCount =
    filters.tags.length +
    filters.moods.length +
    (filters.period !== 'all' ? 1 : 0) +
    (filters.wantToVisit ? 1 : 0) +
    (filters.sortBy !== EMPTY_FILTERS.sortBy ? 1 : 0);

  const displayedPlaces = useMemo(() => {
    const cutoff = periodCutoff(filters.period);
    const filtered = places.filter((p) => {
      if (activeTab === 'favorites' && !p.isFavorite) return false;
      if (filters.wantToVisit && !p.isFavorite) return false;
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((t) => (p.tags ?? []).includes(t));
        if (!hasTag) return false;
      }
      if (cutoff) {
        const dateToCheck = p.lastVisited ?? p.createdAt;
        if (new Date(dateToCheck) < cutoff) return false;
      }
      if (filters.moods.length > 0) {
        const placeNotes = notes.filter((n) => n.placeId === p.id && n.mood);
        const hasMood = placeNotes.some((n) => n.mood && filters.moods.includes(n.mood));
        if (!hasMood) return false;
      }
      return true;
    });
    return sortPlaces(filtered, filters.sortBy);
  }, [places, notes, activeTab, filters]);

  const dayMemory = useMemo(() => pickDayMemory(places, notes), [places, notes]);
  const placeStats = useMemo(() => computeStats(places), [places]);

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function handlePlacePress(id: string) {
    router.push({ pathname: '/place/[id]', params: { id } } as any);
  }

  function handleDeletePlace(id: string, name: string) {
    Alert.alert('Delete Place', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlace(id) },
    ]);
  }

  function toggleTag(tag: string) {
    logFilterUsed('tag', tag);
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function toggleMood(mood: string) {
    logFilterUsed('mood', mood);
    setFilters((f) => ({
      ...f,
      moods: f.moods.includes(mood) ? f.moods.filter((m) => m !== mood) : [...f.moods, mood],
    }));
  }

  function setPeriod(period: FilterPeriod) {
    logFilterUsed('period', period);
    setFilters((f) => ({ ...f, period }));
  }

  function toggleWantToVisit() {
    logFilterUsed('want_to_visit');
    setFilters((f) => ({ ...f, wantToVisit: !f.wantToVisit }));
  }

  function setSortBy(sortBy: SortOption) {
    logFilterUsed('sort', sortBy);
    setFilters((f) => ({ ...f, sortBy }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  return {
    places,
    displayedPlaces,
    upcomingMeetings,
    dayMemory,
    placeStats,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    filters,
    filtersOpen,
    setFiltersOpen,
    allTags,
    allMoods,
    activeFilterCount,
    toggleTag,
    toggleMood,
    setPeriod,
    toggleWantToVisit,
    setSortBy,
    clearFilters,
    handlePlacePress,
    handleDeletePlace,
  };
}
