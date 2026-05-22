import type { Portfolio } from './portfolio';
import type { Demand } from './demand';

export type SearchScope = 'all' | 'portfolio' | 'demand';

export interface SearchResults {
  portfolios: Portfolio[];
  demands: Demand[];
  counts: {
    portfolios: number;
    demands: number;
  };
}
