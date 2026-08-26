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
  // How many memories have been written across every place. The cell here used to repeat
  // "most visited", which the widget directly below already shows by name and photo — one
  // number the widget doesn't carry is worth more than a second copy of one it does.
  memories: number;
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

function computeStats(places: Place[], notes: PlaceNote[]): PlaceStats {
  if (places.length === 0) return { total: 0, memories: 0, topMonth: null };

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

  return { total: places.length, memories: notes.length, topMonth };
}

export interface MostVisitedMemory {
  place: Place;
  note: PlaceNote | null;
  visitCount: number;
  label: string; // "12 visits", "1 visit", "not visited yet"
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

// The place you keep coming back to, which is a fact about the user rather than an accident
// of the calendar. This used to pick by "on this day N years ago", falling back to a
// day-of-year rotation — an app younger than a year could never satisfy the first rule, so in
// practice it just cycled through places on a schedule nobody could perceive as meaningful.
function pickMostVisited(places: Place[], notes: PlaceNote[]): MostVisitedMemory | null {
  if (places.length === 0) return null;

  // Ties go to the most recently visited, then the most recently added — otherwise the winner
  // among equals depends on array order, which shifts as places are added and deleted.
  const [picked] = [...places].sort((a, b) => {
    const visits = (b.visitCount ?? 0) - (a.visitCount ?? 0);
    if (visits !== 0) return visits;
    const lastVisit =
      new Date(b.lastVisited ?? b.createdAt).getTime() -
      new Date(a.lastVisited ?? a.createdAt).getTime();
    if (lastVisit !== 0) return lastVisit;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const placeNotes = notes.filter((n) => n.placeId === picked.id);
  const noteWithPhoto = placeNotes.find((n) => !!n.photoUri || (n.photoUris?.length ?? 0) > 0);
  const visitCount = picked.visitCount ?? 0;

  return {
    place: picked,
    note: noteWithPhoto ?? placeNotes[0] ?? null,
    visitCount,
    label:
      visitCount === 0 ? 'not visited yet' : visitCount === 1 ? '1 visit' : `${visitCount} visits`,
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

  const mostVisited = useMemo(() => pickMostVisited(places, notes), [places, notes]);
  const placeStats = useMemo(() => computeStats(places, notes), [places, notes]);

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
    mostVisited,
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
