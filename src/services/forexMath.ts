import type { ForexPair } from '../types/forex';

export class ForexMath {
  /**
   * Calculates price difference in Pips (not pipettes)
   */
  static getPipDifference(pair: ForexPair, priceA: number, priceB: number): number {
    return Math.abs(priceA - priceB) / pair.pipSize;
  }

  /**
   * Calculates signed pip gain/loss based on order type
   */
  static getPips(pair: ForexPair, type: 'BUY' | 'SELL', entryPrice: number, exitPrice: number): number {
    const diff = exitPrice - entryPrice;
    const pips = diff / pair.pipSize;
    return type === 'BUY' ? pips : -pips;
  }

  /**
   * Calculates dollar value of 1 pip for 1.0 Standard Lot (100,000 units)
   */
  static getPipValuePerStandardLot(pair: ForexPair, currentPrice: number): number {
    const units = pair.lotContractUnits || 100000;

    // Case 1: Quote is USD (e.g. EUR/USD, GBP/USD, AUD/USD, NZD/USD)
    if (pair.quoteCurrency === 'USD') {
      return pair.pipSize * units; // Exactly $10.00 / pip
    }

    // Case 2: Base is USD (e.g. USD/JPY, USD/CAD, USD/CHF)
    if (pair.baseCurrency === 'USD') {
      if (currentPrice <= 0) return 10.0;
      return (pair.pipSize / currentPrice) * units;
    }

    // Case 3: Cross Pairs (e.g. EUR/GBP, CAD/JPY, EUR/JPY)
    if (pair.quoteCurrency === 'JPY') {
      const estUsdJpy = 154.5;
      return (pair.pipSize / estUsdJpy) * units;
    }
    if (pair.quoteCurrency === 'GBP') {
      const estGbpUsd = 1.28;
      return pair.pipSize * units * estGbpUsd;
    }

    return 10.0;
  }

  /**
   * Calculate Realized or Unrealized Profit in Account Currency ($)
   */
  static calculatePnL(
    pair: ForexPair,
    type: 'BUY' | 'SELL',
    entryPrice: number,
    currentPrice: number,
    lotSize: number
  ): { pips: number; pnl: number } {
    const pips = this.getPips(pair, type, entryPrice, currentPrice);
    const pipValuePerLot = this.getPipValuePerStandardLot(pair, currentPrice);
    const pnl = pips * pipValuePerLot * lotSize;
    return {
      pips: Number(pips.toFixed(1)),
      pnl: Number(pnl.toFixed(2)),
    };
  }

  /**
   * Calculate exact lot size based on Stop Loss pips & risk cash amount
   */
  static calculateLotSize(
    pair: ForexPair,
    riskAmount: number,
    slPips: number,
    currentPrice: number
  ): number {
    if (slPips <= 0 || riskAmount <= 0) return 0.01;
    const pipValPerLot = this.getPipValuePerStandardLot(pair, currentPrice);
    const rawLots = riskAmount / (slPips * pipValPerLot);
    return Math.max(0.01, Math.min(100.0, Number(rawLots.toFixed(2))));
  }

  /**
   * Calculate margin required for a position
   */
  static calculateRequiredMargin(
    pair: ForexPair,
    lotSize: number,
    currentPrice: number,
    leverage = 100
  ): number {
    const units = lotSize * pair.lotContractUnits;
    if (pair.baseCurrency === 'USD') {
      return units / leverage;
    }
    return (units * currentPrice) / leverage;
  }

  /**
   * Format price with exact pair decimal precision
   */
  static formatPrice(price: number, decimals: number): string {
    return price.toFixed(decimals);
  }

  /**
   * Formats a unix timestamp in Pakistani Time (PKT / UTC+5) in 12-hour AM/PM format
   */
  static formatPakistaniTime(timeSec: number, includeSeconds = true): string {
    if (!timeSec) return '—';
    const date = new Date(timeSec * 1000);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }) + ' PKT';
  }
}
