import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { Place, PlaceNote } from '../../../models/types';
import { logFilterUsed } from '../../../services/analytics';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { EMPTY_FILTERS, FilterPeriod, PlaceFilters, SortOption, ViewMode } from '../types';

// Which slice of saved places the list is showing — one radio group, exactly one selected.
export type PlaceScope = 'all' | 'favorites' | 'wantToVisit';

export interface PlaceStats {
  total: number;
  // Replaces the old "favourite category": nothing in the app asks for a category any more,
  // so that stat was permanently blank. Which place you actually keep going back to is both
  // real data and more interesting.
  mostVisited: { id: string; name: string; visitCount: number } | null;
  // The month the most places were added, plus how many — the old version showed only the
  // month name under the word "active", which didn't say what happened in it.
  topMonth: { label: string; count: number } | null;
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
  if (places.length === 0) return { total: 0, mostVisited: null, topMonth: null };

  // Most visited place — only counts as a stat once something has actually been visited.
  const busiest = places.reduce((best, p) =>
    (p.visitCount ?? 0) > (best.visitCount ?? 0) ? p : best,
  );
  const mostVisited =
    (busiest.visitCount ?? 0) > 0
      ? { id: busiest.id, name: busiest.name, visitCount: busiest.visitCount ?? 0 }
      : null;

  // Month the most places were added (by createdAt)
  const monthCount: Record<number, number> = {};
  for (const p of places) {
    const m = new Date(p.createdAt).getMonth();
    monthCount[m] = (monthCount[m] ?? 0) + 1;
  }
  const busiestMonth = Object.entries(monthCount).sort((a, b) => b[1] - a[1])[0];
  const topMonth = busiestMonth
    ? { label: MONTH_NAMES[Number(busiestMonth[0])], count: busiestMonth[1] }
    : null;

  return { total: places.length, mostVisited, topMonth };
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
  if (period === 'year') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return null;
}

// Always by date added; the arrow in the list header only flips the direction.
function sortPlaces(places: Place[], sortBy: SortOption): Place[] {
  const sorted = [...places];
  return sorted.sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortBy === 'oldest' ? diff : -diff;
  });
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
  const [placeScope, setPlaceScope] = useState<PlaceScope>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<PlaceFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [places]);

  const activeFilterCount =
    filters.tags.length +
    (filters.period !== 'all' ? 1 : 0) +
    (filters.sortBy !== EMPTY_FILTERS.sortBy ? 1 : 0);

  const displayedPlaces = useMemo(() => {
    const cutoff = periodCutoff(filters.period);
    const filtered = places.filter((p) => {
      // Two different flags with confusingly similar names: `favorite` is the heart,
      // `isFavorite` is "want to visit" (see the v3→v4 store migration).
      if (placeScope === 'favorites' && !p.favorite) return false;
      if (placeScope === 'wantToVisit' && !p.isFavorite) return false;
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((t) => (p.tags ?? []).includes(t));
        if (!hasTag) return false;
      }
      if (cutoff) {
        const dateToCheck = p.lastVisited ?? p.createdAt;
        if (new Date(dateToCheck) < cutoff) return false;
      }
      return true;
    });
    return sortPlaces(filtered, filters.sortBy);
  }, [places, placeScope, filters]);

  const dayMemory = useMemo(() => pickDayMemory(places, notes), [places, notes]);
  const placeStats = useMemo(() => computeStats(places), [places]);

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

  function setPeriod(period: FilterPeriod) {
    logFilterUsed('period', period);
    setFilters((f) => ({ ...f, period }));
  }

  // One radio group, one piece of state — exactly one scope is selected at a time.
  function selectPlaceScope(scope: PlaceScope) {
    if (scope === 'wantToVisit') logFilterUsed('want_to_visit');
    setPlaceScope(scope);
  }

  // The list header shows one arrow rather than a sort menu — this flips its direction.
  function toggleSortDirection() {
    setFilters((f) => ({ ...f, sortBy: f.sortBy === 'newest' ? 'oldest' : 'newest' }));
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
    dayMemory,
    placeStats,
    viewMode,
    setViewMode,
    filters,
    filtersOpen,
    setFiltersOpen,
    allTags,
    activeFilterCount,
    toggleTag,
    setPeriod,
    placeScope,
    selectPlaceScope,
    toggleSortDirection,
    setSortBy,
    clearFilters,
    handlePlacePress,
    handleDeletePlace,
  };
}
