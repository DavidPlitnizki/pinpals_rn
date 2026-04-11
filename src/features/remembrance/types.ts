export type Tab = 'all' | 'favorites';
export type ViewMode = 'list' | 'grid' | 'map';
export type FilterPeriod = 'all' | 'week' | 'month' | '3months' | 'year';

export interface PlaceFilters {
  tags: string[];
  moods: string[];
  period: FilterPeriod;
}

export const EMPTY_FILTERS: PlaceFilters = {
  tags: [],
  moods: [],
  period: 'all',
};
