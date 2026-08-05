export type Tab = 'all' | 'favorites';
export type ViewMode = 'list' | 'grid' | 'map';
export type FilterPeriod = 'all' | 'week' | 'month' | '3months' | 'year';
export type SortOption = 'newest' | 'oldest' | 'name' | 'mostVisited';

export interface PlaceFilters {
  tags: string[];
  moods: string[];
  period: FilterPeriod;
  wantToVisit: boolean;
  sortBy: SortOption;
}

export const EMPTY_FILTERS: PlaceFilters = {
  tags: [],
  moods: [],
  period: 'all',
  wantToVisit: false,
  sortBy: 'newest',
};
