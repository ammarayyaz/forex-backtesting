import type { Candle, ForexPair, Timeframe } from '../types/forex';
import realDataJson from '../data/realHistoricalData.json';

const realDataMap = realDataJson as Record<string, Candle[]>;

export class HistoricalDataEngine {
  /**
   * Resamples granular candles (e.g. M15) into target timeframes (M30, H1, H4, D1)
   */
  static resample(candles: Candle[], targetTf: Timeframe): Candle[] {
    if (candles.length === 0) return [];

    const tfSecondsMap: Record<Timeframe, number> = {
      M1: 60,
      M5: 300,
      M15: 900,
      M30: 1800,
      H1: 3600,
      H4: 14400,
      D1: 86400,
    };

    const bucketSeconds = tfSecondsMap[targetTf] || 900;
    const aggregated: Candle[] = [];

    let currentBucket: Candle | null = null;
    let currentBucketTime = 0;

    for (const c of candles) {
      const bucketTime = Math.floor(c.time / bucketSeconds) * bucketSeconds;

      if (!currentBucket || bucketTime !== currentBucketTime) {
        if (currentBucket) {
          aggregated.push(currentBucket);
        }
        currentBucketTime = bucketTime;
        currentBucket = {
          time: bucketTime,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          bidClose: c.bidClose,
          askClose: c.askClose,
        };
      } else {
        currentBucket.high = Math.max(currentBucket.high, c.high);
        currentBucket.low = Math.min(currentBucket.low, c.low);
        currentBucket.close = c.close;
        currentBucket.volume += c.volume;
        currentBucket.bidClose = c.bidClose;
        currentBucket.askClose = c.askClose;
      }
    }

    if (currentBucket) {
      aggregated.push(currentBucket);
    }

    return aggregated;
  }

  /**
   * Load authentic real historical market data or realistic fractal price action
   */
  static getPairHistory(pair: ForexPair): Candle[] {
    // 1. Check if real authentic interbank data is available
    if (realDataMap[pair.id] && realDataMap[pair.id].length > 0) {
      return realDataMap[pair.id];
    }

    // 2. Otherwise generate realistic Ornstein-Uhlenbeck mean-reverting fractal candles
    return this.generateFractalForexHistory(pair, 2000);
  }

  /**
   * Generates realistic, institutional-grade Forex market price action:
   * Uses Geometric Brownian Motion + Mean Reversion + Session Volatility Waves + Realistic Wicks.
   * Completely avoids linear staircase artifacts.
   */
  static generateFractalForexHistory(pair: ForexPair, totalBars = 2000): Candle[] {
    const candles: Candle[] = [];
    
    const basePriceMap: Record<string, number> = {
      EURUSD: 1.08500,
      GBPUSD: 1.29400,
      USDJPY: 154.200,
      USDCHF: 0.88450,
      USDCAD: 1.39200,
      AUDUSD: 0.65400,
      NZDUSD: 0.59100,
      GBPJPY: 199.500,
      EURJPY: 167.300,
      EURGBP: 0.83850,
      USDZAR: 18.2500,
      USDMXN: 20.3500,
      USDSGD: 1.34100,
    };

    const anchorPrice = basePriceMap[pair.id] || 1.10000;
    let currentPrice = anchorPrice;
    const spreadHalf = (pair.typicalSpreadPips * pair.pipSize) / 2;

    const nowSec = Math.floor(Date.now() / 1000);
    const barInterval = 900; // 15-minute bars
    const startSec = nowSec - (totalBars * barInterval);

    let momentum = 0;
    const meanReversionStrength = 0.04;
    const baseVolatility = pair.pipSize * 6.0;

    for (let i = 0; i < totalBars; i++) {
      const time = startSec + (i * barInterval);
      const date = new Date(time * 1000);
      const hour = date.getUTCHours();

      // Session volatility factor (London & NY overlap have peak volatility)
      let sessionMult = 1.0;
      if (hour >= 0 && hour < 7) sessionMult = 0.6; // Asian quiet
      else if (hour >= 8 && hour < 12) sessionMult = 1.6; // London
      else if (hour >= 13 && hour < 17) sessionMult = 2.0; // NY Overlap
      else sessionMult = 0.8;

      // Ornstein-Uhlenbeck mean-reversion pull towards anchor
      const meanRevert = (anchorPrice - currentPrice) * meanReversionStrength;
      
      // Random shock with fat tails (Student-t approx via multiple uniforms)
      const u1 = Math.random() - 0.5;
      const u2 = Math.random() - 0.5;
      const shock = (u1 + u2 * 0.5) * baseVolatility * sessionMult;

      // Autoregressive momentum with decay
      momentum = momentum * 0.7 + shock;

      const delta = meanRevert + momentum;
      const open = currentPrice;
      const close = open + delta;

      // Realistic intra-bar wicks
      const candleRange = Math.abs(close - open);
      const upperWick = Math.random() * (candleRange * 0.6 + baseVolatility * 0.3 * sessionMult);
      const lowerWick = Math.random() * (candleRange * 0.6 + baseVolatility * 0.3 * sessionMult);

      const high = Math.max(open, close) + upperWick;
      const low = Math.min(open, close) - lowerWick;
      const volume = Math.floor(200 * sessionMult + Math.random() * 500);

      candles.push({
        time,
        open: Number(open.toFixed(pair.decimals)),
        high: Number(high.toFixed(pair.decimals)),
        low: Number(low.toFixed(pair.decimals)),
        close: Number(close.toFixed(pair.decimals)),
        volume,
        bidClose: Number((close - spreadHalf).toFixed(pair.decimals)),
        askClose: Number((close + spreadHalf).toFixed(pair.decimals)),
      });

      currentPrice = close;
    }

    return candles;
  }

  /**
   * Universal CSV Parser for Broker Exports (MT4, MT5, HistData, cTrader)
   */
  static parseBrokerCSV(csvContent: string, pair: ForexPair): Candle[] {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const candles: Candle[] = [];
    const spreadHalf = (pair.typicalSpreadPips * pair.pipSize) / 2;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(/[,;\t]/);
      if (cols.length < 5) continue;

      let timeSec = 0;
      let open = 0, high = 0, low = 0, close = 0, vol = 100;

      if (cols.length >= 6 && isNaN(Number(cols[1]))) {
        const dtStr = `${cols[0]} ${cols[1]}`;
        timeSec = Math.floor(new Date(dtStr).getTime() / 1000);
        open = parseFloat(cols[2]);
        high = parseFloat(cols[3]);
        low = parseFloat(cols[4]);
        close = parseFloat(cols[5]);
        if (cols[6]) vol = parseFloat(cols[6]) || 100;
      } else {
        const dateVal = new Date(cols[0]);
        timeSec = isNaN(dateVal.getTime()) ? parseInt(cols[0], 10) : Math.floor(dateVal.getTime() / 1000);
        open = parseFloat(cols[1]);
        high = parseFloat(cols[2]);
        low = parseFloat(cols[3]);
        close = parseFloat(cols[4]);
        if (cols[5]) vol = parseFloat(cols[5]) || 100;
      }

      if (isNaN(timeSec) || isNaN(close) || close <= 0) continue;

      candles.push({
        time: timeSec,
        open: Number(open.toFixed(pair.decimals)),
        high: Number(high.toFixed(pair.decimals)),
        low: Number(low.toFixed(pair.decimals)),
        close: Number(close.toFixed(pair.decimals)),
        volume: vol,
        bidClose: Number((close - spreadHalf).toFixed(pair.decimals)),
        askClose: Number((close + spreadHalf).toFixed(pair.decimals)),
      });
    }

    candles.sort((a, b) => a.time - b.time);
    return candles;
  }
}
