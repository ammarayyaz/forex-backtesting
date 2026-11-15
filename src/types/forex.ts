export type PairCategory = 'MAJOR' | 'CROSS' | 'EXOTIC';

export interface ForexPair {
  symbol: string;         // e.g. "EUR/USD"
  id: string;             // e.g. "EURUSD"
  category: PairCategory;
  baseCurrency: string;   // e.g. "EUR"
  quoteCurrency: string;  // e.g. "USD"
  pipSize: number;        // 0.0001 for 4-decimal, 0.01 for JPY
  pipetteMultiplier: number; // 10
  decimals: number;       // 5 for standard, 3 for JPY
  typicalSpreadPips: number;
  lotContractUnits: number; // Standard 100,000
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export interface Candle {
  time: number;          // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bidClose?: number;
  askClose?: number;
}

export type OrderType = 'BUY' | 'SELL';
export type OrderExecutionMode = 'MARKET' | 'LIMIT' | 'STOP';

export interface Position {
  id: string;
  pairId: string;
  type: OrderType;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: number;
  pips: number;
  unrealizedPnL: number;
  marginUsed: number;
}

export interface ClosedTrade {
  id: string;
  pairId: string;
  type: OrderType;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: number;
  closeTime: number;
  pips: number;
  realizedPnL: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'MARGIN_CUT';
  riskRewardRatio?: number;
}

export interface AccountState {
  initialBalance: number;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevelPercent: number;
  leverage: number; // e.g. 100 for 1:100
  currency: string; // e.g. 'USD'
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  averageWinPips: number;
  averageLossPips: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  sharpeRatio: number;
  expectedPayoff: number;
}

export interface MarketSession {
  name: string;
  code: string;
  openHourUTC: number;
  closeHourUTC: number;
}

export interface OrderSetupPreview {
  isOpen: boolean;
  type: OrderType;
  lotSize: number;
  slPips: number;
  tpPips: number;
}

