export type ForexNewsImpact = 'High' | 'Medium' | 'Low' | 'Holiday' | 'None';

export interface ForexFactoryNewsEvent {
  id: string;
  title: string;
  country: string; // e.g. "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF"
  date: string;    // ISO timestamp string e.g. "2026-11-16T08:30:00-05:00"
  timestamp: number; // Unix timestamp in seconds
  impact: ForexNewsImpact;
  forecast: string;
  previous: string;
  actual?: string;
}

export type NewsSourceType = 'FAIRECONOMY' | 'JBLANKED' | 'HISTORICAL';

export interface NewsApiConfig {
  source: NewsSourceType;
  jblankedApiKey: string;
}

export interface ForexNewsFilter {
  impactFilter: 'ALL' | 'HIGH_MEDIUM' | 'HIGH_ONLY';
  currencyFilter: 'PAIR_ONLY' | 'ALL';
  showOnChart: boolean;
}
