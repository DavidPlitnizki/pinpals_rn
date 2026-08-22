export type ViewMode = 'list' | 'grid' | 'map';
export type FilterPeriod = 'all' | 'week' | 'month' | 'year';
// Sorting is a single arrow toggle in the list header — newest or oldest by date added.
export type SortOption = 'newest' | 'oldest';

export interface PlaceFilters {
  tags: string[];
  period: FilterPeriod;
  sortBy: SortOption;
}

export const EMPTY_FILTERS: PlaceFilters = {
  tags: [],
  period: 'all',
  sortBy: 'newest',
};
