import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  createSeriesMarkers,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { Candle, ForexPair, Position, Timeframe, OrderSetupPreview } from '../types/forex';
import type { ForexFactoryNewsEvent, ForexNewsFilter } from '../types/news';
import { ForexFactoryNewsService } from '../services/forexFactoryNews';
import { ForexMath } from '../services/forexMath';
import {
  MousePointer,
  TrendingUp,
  Minus,
  Ruler,
  Maximize2,
  Eye,
  EyeOff,
  Clock,
  X,
  Newspaper,
  GripVertical,
  Flame,
  Plus,
  Grid3X3,
  Grid3X3Off,
} from 'lucide-react';

export interface ChartCanvasProps {
  pair: ForexPair;
  timeframe: Timeframe;
  visibleCandles: Candle[];
  currentCandle: Candle | null;
  positions: Position[];
  onUpdatePositionSLTP?: (posId: string, sl?: number, tp?: number) => void;
  orderSetup?: OrderSetupPreview;
  onUpdateOrderSetupSLTP?: (slPips: number, tpPips: number) => void;
  newsEvents?: ForexFactoryNewsEvent[];
  newsFilter?: ForexNewsFilter;
  onOpenNewsDeck?: () => void;
  isDark?: boolean;
}

interface ClickedBarInfo {
  startTime: string;
  endTime: string;
  duration: string;
  open: number;
  high: number;
  low: number;
  close: number;
  rangePips: string;
  x: number;
  y: number;
  newsAtBar?: ForexFactoryNewsEvent[];
}

interface DraggingTarget {
  type: 'POS_SL' | 'POS_TP' | 'SETUP_SL' | 'SETUP_TP';
  posId?: string;
  currentPrice: number;
  pips: number;
  dollarVal: number;
  mouseY: number;
  tooltipY: number;
}

const tfSecondsMap: Record<Timeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
};

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  pair,
  timeframe,
  visibleCandles,
  currentCandle,
  positions,
  onUpdatePositionSLTP,
  orderSetup,
  onUpdateOrderSetupSLTP,
  newsEvents = [],
  newsFilter,
  onOpenNewsDeck,
  isDark = false,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const seriesMarkersRef = useRef<any>(null);

  const [hoverData, setHoverData] = useState<Candle | null>(null);
  const [clickedBar, setClickedBar] = useState<ClickedBarInfo | null>(null);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showOHLCStrip, setShowOHLCStrip] = useState<boolean>(true);
  const showVolume = true;
  const [activeTool, setActiveTool] = useState<string>('cursor');

  // Chart Grid Lines visibility (persisted in localStorage)
  const [showVertGrid, setShowVertGrid] = useState<boolean>(() => {
    const saved = localStorage.getItem('quantfx_show_vert_grid');
    return saved !== null ? saved === 'true' : true;
  });
  const [showHorzGrid, setShowHorzGrid] = useState<boolean>(() => {
    const saved = localStorage.getItem('quantfx_show_horz_grid');
    return saved !== null ? saved === 'true' : true;
  });
  const [isGridMenuOpen, setIsGridMenuOpen] = useState<boolean>(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  const showVertGridRef = useRef(showVertGrid);
  showVertGridRef.current = showVertGrid;
  const showHorzGridRef = useRef(showHorzGrid);
  showHorzGridRef.current = showHorzGrid;

  const handleToggleVertGrid = () => {
    setShowVertGrid((prev) => {
      const next = !prev;
      localStorage.setItem('quantfx_show_vert_grid', String(next));
      return next;
    });
  };

  const handleToggleHorzGrid = () => {
    setShowHorzGrid((prev) => {
      const next = !prev;
      localStorage.setItem('quantfx_show_horz_grid', String(next));
      return next;
    });
  };

  const handleToggleAllGrid = (enable?: boolean) => {
    const target = typeof enable === 'boolean' ? enable : !(showVertGrid || showHorzGrid);
    setShowVertGrid(target);
    setShowHorzGrid(target);
    localStorage.setItem('quantfx_show_vert_grid', String(target));
    localStorage.setItem('quantfx_show_horz_grid', String(target));
  };

  // Close grid options menu on click outside or Escape
  useEffect(() => {
    if (!isGridMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGridMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGridMenuOpen]);

  // Trigger re-render of draggable lines when chart scales or scrolls
  const [, setCoordTick] = useState(0);

  // Active dragging state
  const [dragState, setDragState] = useState<DraggingTarget | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Prev trackers to fix the chart jumping bug
  const prevCandlesCountRef = useRef<number>(0);
  const prevPairIdRef = useRef<string>(pair.id);
  const prevTimeframeRef = useRef<string>(timeframe);

  const priceLinesRef = useRef<any[]>([]);

  const calculateEMA = (candles: Candle[], period: number) => {
    if (candles.length < period) return [];
    const k = 2 / (period + 1);
    const emaData: { time: any; value: number }[] = [];

    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += candles[i].close;
    }
    let prevEma = sum / period;
    emaData.push({ time: candles[period - 1].time as any, value: prevEma });

    for (let i = period; i < candles.length; i++) {
      const currentEma = candles[i].close * k + prevEma * (1 - k);
      emaData.push({ time: candles[i].time as any, value: currentEma });
      prevEma = currentEma;
    }

    return emaData;
  };

  // Map news events to visible candles
  const filteredNews = useMemo(() => {
    if (!newsFilter || !newsEvents.length) return [];
    return ForexFactoryNewsService.filterEvents(newsEvents, pair, newsFilter);
  }, [newsEvents, pair, newsFilter]);

  const mappedNews = useMemo(() => {
    return ForexFactoryNewsService.mapEventsToCandles(
      filteredNews,
      visibleCandles,
      tfSecondsMap[timeframe] || 900
    );
  }, [filteredNews, visibleCandles, timeframe]);

  const mappedNewsRef = useRef(mappedNews);
  mappedNewsRef.current = mappedNews;

  // Initialize Light Mode Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#000000' : '#FFFFFF' },
        textColor: isDark ? '#A1A1AA' : '#897E9C',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showVertGridRef.current,
        },
        horzLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showHorzGridRef.current,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDark ? '#3F3F46' : '#BCAED9',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1F1F24' : '#1A1325',
        },
        horzLine: {
          color: isDark ? '#3F3F46' : '#BCAED9',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1F1F24' : '#1A1325',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1F1F24' : '#E8DEF4',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: isDark ? '#1F1F24' : '#E8DEF4',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: true,
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
      priceFormat: {
        type: 'price',
        precision: pair.decimals,
        minMove: pair.pipSize / pair.pipetteMultiplier,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#9333EA',
      lineWidth: 1,
      title: 'EMA 20',
      priceScaleId: 'right',
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color: '#6366F1',
      lineWidth: 1,
      title: 'EMA 50',
      priceScaleId: 'right',
    });

    // Create markers plugin instance
    const markersPlugin = createSeriesMarkers(candlestickSeries, []);
    seriesMarkersRef.current = markersPlugin;

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;

    // Reset tracking refs on chart creation
    prevCandlesCountRef.current = 0;
    prevPairIdRef.current = pair.id;
    prevTimeframeRef.current = timeframe;

    // Subscribe to time scale visible range change so drag overlays update coordinates smoothly
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      setCoordTick((t) => t + 1);
    });

    // Crosshair hover inspection
    chart.subscribeCrosshairMove((param) => {
      setCoordTick((t) => t + 1);
      if (!param || !param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const data = param.seriesData.get(candlestickSeries) as any;
      if (data) {
        setHoverData({
          time: param.time as number,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: 0,
        });
      }
    });

    // Click on timeline/candle -> Show Pakistani Time & News popup
    chart.subscribeClick((param) => {
      if (!param || !param.time || !param.seriesData) {
        setClickedBar(null);
        return;
      }
      const data = param.seriesData.get(candlestickSeries) as any;
      if (data) {
        const timeSec = param.time as number;
        const durationSec = tfSecondsMap[timeframe] || 900;
        const startTime = timeSec;
        const endTime = timeSec + durationSec;

        const containerW = chartContainerRef.current?.clientWidth || 360;
        const containerH = chartContainerRef.current?.clientHeight || 400;
        const rawX = param.point?.x ?? 220;
        const rawY = param.point?.y ?? 120;

        // Check if there are news events at this candle
        const newsHere = mappedNewsRef.current
          .filter((m) => m.candleTime === timeSec)
          .map((m) => m.event);

        setClickedBar({
          startTime: ForexMath.formatPakistaniTime(startTime, false),
          endTime: ForexMath.formatPakistaniTime(endTime, false),
          duration: timeframe,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          rangePips: ((data.high - data.low) / pair.pipSize).toFixed(1),
          x: Math.min(Math.max(8, rawX - 128), containerW - 280),
          y: Math.max(8, Math.min(rawY - 140, containerH - 240)),
          newsAtBar: newsHere.length > 0 ? newsHere : undefined,
        });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
        setCoordTick((t) => t + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
      seriesMarkersRef.current = null;
    };
  }, [pair.id, pair.decimals, pair.pipSize, pair.pipetteMultiplier, timeframe]);

  // Apply dark / light theme dynamically to existing chart without reload
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#000000' : '#FFFFFF' },
        textColor: isDark ? '#A1A1AA' : '#897E9C',
      },
      grid: {
        vertLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showVertGridRef.current,
        },
        horzLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showHorzGridRef.current,
        },
      },
      crosshair: {
        vertLine: {
          color: isDark ? '#3F3F46' : '#BCAED9',
          labelBackgroundColor: isDark ? '#1F1F24' : '#1A1325',
        },
        horzLine: {
          color: isDark ? '#3F3F46' : '#BCAED9',
          labelBackgroundColor: isDark ? '#1F1F24' : '#1A1325',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1F1F24' : '#E8DEF4',
      },
      timeScale: {
        borderColor: isDark ? '#1F1F24' : '#E8DEF4',
      },
    });
  }, [isDark]);

  // Apply dynamic grid line updates smoothly without resetting chart zoom or scroll
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.applyOptions({
      grid: {
        vertLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showVertGrid,
        },
        horzLines: {
          color: isDark ? '#141418' : '#F4EFFB',
          visible: showHorzGrid,
        },
      },
    });
  }, [showVertGrid, showHorzGrid, isDark]);

  // Update News Markers on Chart
  useEffect(() => {
    if (!seriesMarkersRef.current) return;

    if (!newsFilter?.showOnChart || mappedNews.length === 0) {
      seriesMarkersRef.current.setMarkers([]);
      return;
    }

    const markers = mappedNews.map(({ event, candleTime }) => {
      const color = ForexFactoryNewsService.getImpactColor(event.impact);
      const isHigh = event.impact === 'High';
      const shape = isHigh ? 'square' : 'circle';
      const prefix = isHigh ? '[H]' : event.impact === 'Medium' ? '[M]' : '[L]';

      return {
        id: event.id,
        time: candleTime as any,
        position: 'aboveBar' as const,
        color,
        shape,
        text: `${prefix} ${event.country} ${event.title.slice(0, 14)}`,
      };
    });

    seriesMarkersRef.current.setMarkers(markers);
  }, [mappedNews, newsFilter?.showOnChart]);

  // Candle Data Update: Fixed candle forwarding without chart jumping
  useEffect(() => {
    if (!candleSeriesRef.current || visibleCandles.length === 0) return;

    const currentCount = visibleCandles.length;
    const prevCount = prevCandlesCountRef.current;
    const isPairOrTfChange =
      prevPairIdRef.current !== pair.id || prevTimeframeRef.current !== timeframe;

    // Condition 1: Initial load, pair/timeframe switch, or backward step/reset
    if (isPairOrTfChange || currentCount < prevCount || prevCount === 0) {
      const candleFormatted = visibleCandles.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(candleFormatted);

      if (volumeSeriesRef.current) {
        if (showVolume) {
          const volumeFormatted = visibleCandles.map((c) => ({
            time: c.time as any,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
          }));
          volumeSeriesRef.current.setData(volumeFormatted);
        } else {
          volumeSeriesRef.current.setData([]);
        }
      }

      if (ema20SeriesRef.current && ema50SeriesRef.current) {
        if (showEMA) {
          ema20SeriesRef.current.setData(calculateEMA(visibleCandles, 20));
          ema50SeriesRef.current.setData(calculateEMA(visibleCandles, 50));
        } else {
          ema20SeriesRef.current.setData([]);
          ema50SeriesRef.current.setData([]);
        }
      }

      // ONLY on initial load or pair switch do we scroll/fit to real time
      if (prevCount === 0 || isPairOrTfChange) {
        chartInstanceRef.current?.timeScale().scrollToRealTime();
      }

      prevCandlesCountRef.current = currentCount;
      prevPairIdRef.current = pair.id;
      prevTimeframeRef.current = timeframe;
      setCoordTick((t) => t + 1);
      return;
    }

    // Condition 2: Forwarding ONE candle (Smooth step without resetting viewport)
    if (currentCount === prevCount + 1) {
      const lastCandle = visibleCandles[currentCount - 1];

      candleSeriesRef.current.update({
        time: lastCandle.time as any,
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
      });

      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current.update({
          time: lastCandle.time as any,
          value: lastCandle.volume,
          color: lastCandle.close >= lastCandle.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
        });
      }

      if (ema20SeriesRef.current && showEMA) {
        const ema20 = calculateEMA(visibleCandles, 20);
        if (ema20.length > 0) ema20SeriesRef.current.update(ema20[ema20.length - 1]);
      }

      if (ema50SeriesRef.current && showEMA) {
        const ema50 = calculateEMA(visibleCandles, 50);
        if (ema50.length > 0) ema50SeriesRef.current.update(ema50[ema50.length - 1]);
      }

      // IMPORTANT: DO NOT call scrollToRealTime() here!
      // lightweight-charts will naturally advance the time scale by 1 bar spacing smoothly without jumping.
      prevCandlesCountRef.current = currentCount;
      setCoordTick((t) => t + 1);
      return;
    }

    // Condition 3: Multi-bar step / bulk replay forward
    if (currentCount > prevCount + 1) {
      const candleFormatted = visibleCandles.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(candleFormatted);

      if (volumeSeriesRef.current && showVolume) {
        const volumeFormatted = visibleCandles.map((c) => ({
          time: c.time as any,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
        }));
        volumeSeriesRef.current.setData(volumeFormatted);
      }

      if (ema20SeriesRef.current && ema50SeriesRef.current && showEMA) {
        ema20SeriesRef.current.setData(calculateEMA(visibleCandles, 20));
        ema50SeriesRef.current.setData(calculateEMA(visibleCandles, 50));
      }

      prevCandlesCountRef.current = currentCount;
      setCoordTick((t) => t + 1);
    }
  }, [visibleCandles, showEMA, showVolume, pair.id, timeframe]);

  // Update Price Lines on the Lightweight Charts canvas (Bid / Ask / Entry)
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    priceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch {
        // ignore
      }
    });
    priceLinesRef.current = [];

    // Draw entry line and bid/ask lines
    positions.forEach((pos) => {
      if (pos.pairId !== pair.id) return;

      const entryLine = candleSeriesRef.current?.createPriceLine({
        price: pos.entryPrice,
        color: pos.type === 'BUY' ? '#7C3AED' : '#9333EA',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${pos.type} ${pos.lotSize}L @ ${ForexMath.formatPrice(pos.entryPrice, pair.decimals)}`,
      });
      if (entryLine) priceLinesRef.current.push(entryLine);
    });

    if (currentCandle && currentCandle.askClose && currentCandle.bidClose) {
      const askLine = candleSeriesRef.current?.createPriceLine({
        price: currentCandle.askClose,
        color: '#F43F5E',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: false,
        title: 'Ask',
      });
      const bidLine = candleSeriesRef.current?.createPriceLine({
        price: currentCandle.bidClose,
        color: '#7C3AED',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: false,
        title: 'Bid',
      });
      if (askLine) priceLinesRef.current.push(askLine);
      if (bidLine) priceLinesRef.current.push(bidLine);
    }

    setCoordTick((t) => t + 1);
  }, [positions, currentCandle, pair]);

  // Current Bid / Ask
  const currentBid = currentCandle?.bidClose || currentCandle?.close || 1.085;
  const currentAsk = currentCandle?.askClose || currentBid + pair.typicalSpreadPips * pair.pipSize;

  // Compute Coordinates for Open Positions (incorporating real-time drag movements)
  const activePositionsWithCoords = useMemo(() => {
    if (!candleSeriesRef.current) return [];

    return positions
      .filter((p) => p.pairId === pair.id)
      .map((pos) => {
        const isDraggingThisSL = dragState?.type === 'POS_SL' && dragState?.posId === pos.id;
        const isDraggingThisTP = dragState?.type === 'POS_TP' && dragState?.posId === pos.id;

        const effectiveSLPrice = isDraggingThisSL ? dragState.currentPrice : pos.stopLoss;
        const effectiveTPPrice = isDraggingThisTP ? dragState.currentPrice : pos.takeProfit;

        const yEntry = candleSeriesRef.current?.priceToCoordinate(pos.entryPrice) ?? null;
        const ySL = effectiveSLPrice ? (candleSeriesRef.current?.priceToCoordinate(effectiveSLPrice) ?? null) : null;
        const yTP = effectiveTPPrice ? (candleSeriesRef.current?.priceToCoordinate(effectiveTPPrice) ?? null) : null;

        const pipVal = ForexMath.getPipValuePerStandardLot(pair, pos.entryPrice) * pos.lotSize;
        const slPips = effectiveSLPrice
          ? Math.abs(effectiveSLPrice - pos.entryPrice) / pair.pipSize
          : 0;
        const slDollar = slPips * pipVal;

        const tpPips = effectiveTPPrice
          ? Math.abs(effectiveTPPrice - pos.entryPrice) / pair.pipSize
          : 0;
        const tpDollar = tpPips * pipVal;

        return {
          pos,
          yEntry,
          ySL,
          yTP,
          effectiveSLPrice,
          effectiveTPPrice,
          slPips,
          slDollar,
          tpPips,
          tpDollar,
          isDraggingThisSL,
          isDraggingThisTP,
        };
      });
  }, [positions, pair, dragState]);

  // Compute Coordinates for Order Setup Preview (When Opening an Order, incorporating real-time drag movements)
  const orderSetupCoords = useMemo(() => {
    if (!orderSetup || !orderSetup.isOpen || !candleSeriesRef.current) return null;

    const entryPrice = orderSetup.type === 'BUY' ? currentAsk : currentBid;
    const isDraggingSetupSL = dragState?.type === 'SETUP_SL';
    const isDraggingSetupTP = dragState?.type === 'SETUP_TP';

    const currentSlPips = isDraggingSetupSL ? dragState.pips : orderSetup.slPips;
    const currentTpPips = isDraggingSetupTP ? dragState.pips : orderSetup.tpPips;

    const slDist = currentSlPips * pair.pipSize;
    const tpDist = currentTpPips * pair.pipSize;

    const slPrice = isDraggingSetupSL
      ? dragState.currentPrice
      : Number((orderSetup.type === 'BUY' ? entryPrice - slDist : entryPrice + slDist).toFixed(pair.decimals));

    const tpPrice = isDraggingSetupTP
      ? dragState.currentPrice
      : Number((orderSetup.type === 'BUY' ? entryPrice + tpDist : entryPrice - tpDist).toFixed(pair.decimals));

    const yEntry = candleSeriesRef.current?.priceToCoordinate(entryPrice) ?? null;
    const ySL = candleSeriesRef.current?.priceToCoordinate(slPrice) ?? null;
    const yTP = candleSeriesRef.current?.priceToCoordinate(tpPrice) ?? null;

    const pipVal = ForexMath.getPipValuePerStandardLot(pair, entryPrice) * orderSetup.lotSize;
    const slDollar = currentSlPips * pipVal;
    const tpDollar = currentTpPips * pipVal;

    return {
      type: orderSetup.type,
      lotSize: orderSetup.lotSize,
      entryPrice,
      slPrice,
      tpPrice,
      yEntry,
      ySL,
      yTP,
      slPips: currentSlPips,
      tpPips: currentTpPips,
      slDollar,
      tpDollar,
      isDraggingSetupSL,
      isDraggingSetupTP,
    };
  }, [orderSetup, pair, currentAsk, currentBid, dragState]);

  // Mid Market Live Calculations for Active Positions
  const openPositions = useMemo(() => positions.filter((p) => p.pairId === pair.id), [positions, pair.id]);
  const totalUnrealizedPnL = openPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
  const totalPips = openPositions.reduce((acc, p) => acc + p.pips, 0);
  const isOverallProfit = totalUnrealizedPnL >= 0;

  const yMidMarket = currentCandle && candleSeriesRef.current
    ? candleSeriesRef.current.priceToCoordinate(currentCandle.close)
    : null;

  const xLiveCandle = currentCandle && chartInstanceRef.current
    ? chartInstanceRef.current.timeScale().timeToCoordinate(currentCandle.time as any)
    : null;

  // DRAG & DROP HANDLERS FOR SL AND TP
  const handleStartDrag = useCallback(
    (
      e: React.PointerEvent,
      type: DraggingTarget['type'],
      posId?: string,
      initialPrice?: number,
      initialPips: number = 20,
      initialDollar: number = 0
    ) => {
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const rect = chartContainerRef.current?.getBoundingClientRect();
      const containerTop = rect?.top || 0;
      const initialTooltipY = Math.max(12, Math.min(e.clientY - containerTop - 36, (rect?.height || 400) - 40));

      isDraggingRef.current = true;
      setDragState({
        type,
        posId,
        currentPrice: initialPrice || 0,
        pips: initialPips,
        dollarVal: initialDollar,
        mouseY: e.clientY,
        tooltipY: initialTooltipY,
      });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !dragState || !candleSeriesRef.current || !chartContainerRef.current) {
        return;
      }

      const rect = chartContainerRef.current.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const rawPrice = candleSeriesRef.current.coordinateToPrice(relativeY);
      if (rawPrice === null || isNaN(rawPrice)) return;

      const newPrice = Number(rawPrice.toFixed(pair.decimals));
      const tooltipY = Math.max(12, Math.min(e.clientY - rect.top - 36, rect.height - 40));

      if (dragState.type === 'POS_SL' || dragState.type === 'POS_TP') {
        const targetPos = positions.find((p) => p.id === dragState.posId);
        if (!targetPos) return;

        const pipsDiff = Math.abs(newPrice - targetPos.entryPrice) / pair.pipSize;
        const pipVal = ForexMath.getPipValuePerStandardLot(pair, targetPos.entryPrice) * targetPos.lotSize;
        const dollarVal = pipsDiff * pipVal;

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentPrice: newPrice,
                pips: pipsDiff,
                dollarVal,
                mouseY: e.clientY,
                tooltipY,
              }
            : null
        );
      } else if (dragState.type === 'SETUP_SL' || dragState.type === 'SETUP_TP') {
        const entryPrice = orderSetup?.type === 'BUY' ? currentAsk : currentBid;
        const pipsDiff = Math.max(1, Math.round(Math.abs(newPrice - entryPrice) / pair.pipSize));
        const pipVal = ForexMath.getPipValuePerStandardLot(pair, entryPrice) * (orderSetup?.lotSize || 1);
        const dollarVal = pipsDiff * pipVal;

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentPrice: newPrice,
                pips: pipsDiff,
                dollarVal,
                mouseY: e.clientY,
                tooltipY,
              }
            : null
        );

        // Update setup SL/TP live so Order Execution console inputs reflect the drag in real time
        if (dragState.type === 'SETUP_SL') {
          onUpdateOrderSetupSLTP?.(pipsDiff, orderSetup?.tpPips || 40);
        } else if (dragState.type === 'SETUP_TP') {
          onUpdateOrderSetupSLTP?.(orderSetup?.slPips || 20, pipsDiff);
        }
      }
    },
    [dragState, pair, positions, orderSetup, currentAsk, currentBid, onUpdateOrderSetupSLTP]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !dragState) return;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      isDraggingRef.current = false;

      // Apply modifications
      if (dragState.type === 'POS_SL' && dragState.posId) {
        const pos = positions.find((p) => p.id === dragState.posId);
        if (pos) {
          onUpdatePositionSLTP?.(pos.id, dragState.currentPrice, pos.takeProfit);
        }
      } else if (dragState.type === 'POS_TP' && dragState.posId) {
        const pos = positions.find((p) => p.id === dragState.posId);
        if (pos) {
          onUpdatePositionSLTP?.(pos.id, pos.stopLoss, dragState.currentPrice);
        }
      } else if (dragState.type === 'SETUP_SL') {
        onUpdateOrderSetupSLTP?.(Math.round(dragState.pips), orderSetup?.tpPips || 40);
      } else if (dragState.type === 'SETUP_TP') {
        onUpdateOrderSetupSLTP?.(orderSetup?.slPips || 20, Math.round(dragState.pips));
      }

      setDragState(null);
      setCoordTick((t) => t + 1);
    },
    [dragState, positions, onUpdatePositionSLTP, orderSetup, onUpdateOrderSetupSLTP]
  );

  const activeCandle = hoverData || currentCandle;
  const priceChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const priceChangePips = activeCandle ? (priceChange / pair.pipSize).toFixed(1) : '0.0';
  const priceChangePercent =
    activeCandle && activeCandle.open > 0 ? ((priceChange / activeCandle.open) * 100).toFixed(2) : '0.00';

  const pairNewsCount = filteredNews.filter((n) => n.impact === 'High').length;

  return (
    <div className="relative w-full h-full flex bg-white dark:bg-[#000000] select-none overflow-hidden">
      {/* Left Toolbar */}
      <div className="hidden sm:flex w-10 bg-white dark:bg-[#000000] border-r border-[#E8DEF4] dark:border-[#1F1F24] flex-col items-center py-2 space-y-2 z-10 shrink-0">
        <button
          onClick={() => setActiveTool('cursor')}
          title="Cursor"
          className={`p-2 rounded-[4px] transition-colors ${
            activeTool === 'cursor'
              ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
              : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setActiveTool('trendline')}
          title="Trend Line"
          className={`p-2 rounded-[4px] transition-colors ${
            activeTool === 'trendline'
              ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
              : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setActiveTool('horizontal')}
          title="Horizontal Level"
          className={`p-2 rounded-[4px] transition-colors ${
            activeTool === 'horizontal'
              ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
              : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setActiveTool('ruler')}
          title="Measure Pips"
          className={`p-2 rounded-[4px] transition-colors ${
            activeTool === 'ruler'
              ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
              : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>

        <div className="w-5 h-[1px] bg-[#E8DEF4] dark:bg-[#1F1F24] my-1" />

        <button
          onClick={() => setShowEMA(!showEMA)}
          title="Toggle EMAs"
          className={`p-2 rounded-[4px] transition-colors ${
            showEMA
              ? 'text-[#7C3AED] bg-[#F3EEF9] dark:bg-[#141418]'
              : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
          }`}
        >
          {showEMA ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Chart Grid Lines Options */}
        <div className="relative" ref={gridMenuRef}>
          <button
            onClick={() => setIsGridMenuOpen((prev) => !prev)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleToggleAllGrid();
            }}
            title={
              showVertGrid || showHorzGrid
                ? 'Grid Lines: Active (Click for options, double-click to toggle all)'
                : 'Grid Lines: Off (Click for options, double-click to toggle all)'
            }
            className={`p-2 rounded-[4px] transition-colors cursor-pointer relative ${
              showVertGrid || showHorzGrid
                ? 'text-[#7C3AED] bg-[#F3EEF9] dark:bg-[#141418]'
                : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418]'
            }`}
          >
            {showVertGrid || showHorzGrid ? (
              <Grid3X3 className="w-3.5 h-3.5" />
            ) : (
              <Grid3X3Off className="w-3.5 h-3.5" />
            )}
            {((showVertGrid && !showHorzGrid) || (!showVertGrid && showHorzGrid)) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
            )}
          </button>

          {/* Grid Options Flyout */}
          {isGridMenuOpen && (
            <div
              className="absolute left-10 top-0 z-50 w-64 bg-white dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] shadow-xl p-3 text-xs text-[#1A1325] dark:text-[#EDEDED] select-none"
              style={{ minWidth: '220px' }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F4EFFB] dark:border-[#1F1F24]">
                <div className="flex items-center space-x-1.5 font-semibold text-[#1A1325] dark:text-[#EDEDED]">
                  <Grid3X3 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Chart Grid Lines</span>
                </div>
                <button
                  onClick={() => setIsGridMenuOpen(false)}
                  className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-0.5 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Master All Grid Toggle */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-[4px] bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] mb-2.5">
                <div>
                  <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] block text-[11px]">
                    All Grid Lines
                  </span>
                  <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] block">
                    {showVertGrid || showHorzGrid ? 'Grid lines visible' : 'Grid lines hidden'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showVertGrid || showHorzGrid}
                  onClick={() => handleToggleAllGrid()}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                    showVertGrid || showHorzGrid ? 'bg-[#7C3AED]' : 'bg-[#E8DEF4] dark:bg-[#27272A]'
                  }`}
                  title="Toggle all grid lines"
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-150 ease-in-out ${
                      showVertGrid || showHorzGrid ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Granular Toggles */}
              <div className="space-y-2">
                {/* Horizontal Grid */}
                <div className="flex items-center justify-between py-1 px-1 rounded hover:bg-[#FAF7FD] dark:hover:bg-[#141418] transition-colors">
                  <div>
                    <span className="font-medium text-[#1A1325] dark:text-[#EDEDED] block text-[11px]">
                      Horizontal Grid
                    </span>
                    <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] block">
                      Price levels
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHorzGrid}
                    onClick={handleToggleHorzGrid}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                      showHorzGrid ? 'bg-[#7C3AED]' : 'bg-[#E8DEF4] dark:bg-[#27272A]'
                    }`}
                    title="Toggle horizontal grid lines"
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-150 ease-in-out ${
                        showHorzGrid ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Vertical Grid */}
                <div className="flex items-center justify-between py-1 px-1 rounded hover:bg-[#FAF7FD] dark:hover:bg-[#141418] transition-colors">
                  <div>
                    <span className="font-medium text-[#1A1325] dark:text-[#EDEDED] block text-[11px]">
                      Vertical Grid
                    </span>
                    <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] block">
                      Time intervals
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showVertGrid}
                    onClick={handleToggleVertGrid}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                      showVertGrid ? 'bg-[#7C3AED]' : 'bg-[#E8DEF4] dark:bg-[#27272A]'
                    }`}
                    title="Toggle vertical grid lines"
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-150 ease-in-out ${
                        showVertGrid ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Presets / Quick Actions */}
              <div className="mt-3 pt-2 border-t border-[#F4EFFB] dark:border-[#1F1F24] flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => handleToggleAllGrid(false)}
                  className="text-[#897E9C] dark:text-[#71717A] hover:text-[#F43F5E] dark:hover:text-[#F43F5E] transition-colors cursor-pointer font-medium active:scale-95"
                >
                  Turn off all
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllGrid(true)}
                  className="text-[#7C3AED] hover:text-[#6D28D9] dark:hover:text-[#A78BFA] transition-colors cursor-pointer font-semibold active:scale-95"
                >
                  Turn on both
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            chartInstanceRef.current?.timeScale().fitContent();
          }}
          title="Reset Zoom"
          className="p-2 rounded-[4px] text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#FAF7FD] dark:hover:bg-[#141418] transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-white dark:bg-[#000000]">
        {/* Top Controls Strip */}
        {showOHLCStrip ? (
          <div className="absolute top-2 left-2 sm:left-3 z-10 flex items-center space-x-2 max-w-[calc(100%-80px)] sm:max-w-none">
            <div className="bg-white/95 dark:bg-[#000000]/90 border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs rounded-[6px] px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md flex items-center space-x-1.5 sm:space-x-2.5 text-xs text-[#1A1325] dark:text-[#EDEDED] truncate">
              <span className="font-bold text-[#1A1325] dark:text-[#EDEDED] shrink-0">{pair.symbol}</span>

              {activeCandle && (
                <div className="hidden sm:flex items-center space-x-2 text-[11px] tabular-figures">
                  <span className="text-[#897E9C] dark:text-[#71717A]">O</span>
                  <span>{ForexMath.formatPrice(activeCandle.open, pair.decimals)}</span>
                  <span className="text-[#897E9C] dark:text-[#71717A]">H</span>
                  <span className="text-[#10B981]">{ForexMath.formatPrice(activeCandle.high, pair.decimals)}</span>
                  <span className="text-[#897E9C] dark:text-[#71717A]">L</span>
                  <span className="text-[#F43F5E]">{ForexMath.formatPrice(activeCandle.low, pair.decimals)}</span>
                  <span className="text-[#897E9C] dark:text-[#71717A]">C</span>
                  <span
                    className={`font-semibold ${
                      activeCandle.close >= activeCandle.open ? 'text-[#10B981]' : 'text-[#F43F5E]'
                    }`}
                  >
                    {ForexMath.formatPrice(activeCandle.close, pair.decimals)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      priceChange >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                    }`}
                  >
                    {priceChange >= 0 ? '+' : ''}
                    {priceChangePips}p ({priceChangePercent}%)
                  </span>
                </div>
              )}

              {/* Hide Button */}
              <button
                onClick={() => setShowOHLCStrip(false)}
                title="Hide Info Bar"
                className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-0.5 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer ml-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Forex Factory News Quick Button */}
            {onOpenNewsDeck && (
              <button
                onClick={onOpenNewsDeck}
                title="Open Forex Factory News Calendar"
                className="bg-white/95 dark:bg-[#000000]/90 border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[6px] flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Newspaper className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="hidden sm:inline">FF News</span>
                {pairNewsCount > 0 && (
                  <span className="text-[10px] bg-[#EF4444] text-white px-1.5 py-0.1 rounded-full font-bold flex items-center space-x-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    <span>{pairNewsCount}</span>
                  </span>
                )}
              </button>
            )}

            {/* Mobile Grid Lines Quick Toggle */}
            <button
              onClick={() => handleToggleAllGrid()}
              title={
                showVertGrid || showHorzGrid
                  ? 'Grid Lines: Active (Tap to hide all)'
                  : 'Grid Lines: Hidden (Tap to show)'
              }
              className={`sm:hidden border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs px-2 py-0.5 rounded-[6px] flex items-center space-x-1 cursor-pointer transition-colors ${
                showVertGrid || showHorzGrid
                  ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
                  : 'bg-white/95 dark:bg-[#000000]/90 text-[#897E9C] dark:text-[#71717A]'
              }`}
            >
              {showVertGrid || showHorzGrid ? (
                <Grid3X3 className="w-3.5 h-3.5 text-[#7C3AED]" />
              ) : (
                <Grid3X3Off className="w-3.5 h-3.5 text-[#897E9C] dark:text-[#71717A]" />
              )}
              <span className="text-[10px] font-semibold">Grid</span>
            </button>

            {showEMA && (
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
                <span className="border border-[#9333EA]/40 bg-white dark:bg-[#0A0A0C] text-[#9333EA] font-medium px-1.5 py-0.5 rounded-[4px]">
                  EMA 20
                </span>
                <span className="border border-[#6366F1]/40 bg-white dark:bg-[#0A0A0C] text-[#6366F1] font-medium px-1.5 py-0.5 rounded-[4px]">
                  EMA 50
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Reopen Info Bar Button */
          <div className="absolute top-2 left-2 sm:left-3 z-10 flex items-center space-x-1.5">
            <button
              onClick={() => setShowOHLCStrip(true)}
              title="Show OHLC Bar"
              className="bg-white/95 dark:bg-[#000000]/90 border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[6px] flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <span>{pair.symbol}</span>
              <Eye className="w-3 h-3 text-[#7C3AED]" />
            </button>

            {onOpenNewsDeck && (
              <button
                onClick={onOpenNewsDeck}
                title="Forex Factory News"
                className="bg-white/95 dark:bg-[#000000]/90 border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[6px] flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Newspaper className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="hidden sm:inline">News</span>
              </button>
            )}

            {/* Mobile Grid Lines Quick Toggle */}
            <button
              onClick={() => handleToggleAllGrid()}
              title={
                showVertGrid || showHorzGrid
                  ? 'Grid Lines: Active (Tap to hide all)'
                  : 'Grid Lines: Hidden (Tap to show)'
              }
              className={`sm:hidden border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xs px-2 py-0.5 rounded-[6px] flex items-center space-x-1 cursor-pointer transition-colors ${
                showVertGrid || showHorzGrid
                  ? 'bg-[#F3EEF9] dark:bg-[#141418] text-[#7C3AED]'
                  : 'bg-white/95 dark:bg-[#000000]/90 text-[#897E9C] dark:text-[#71717A]'
              }`}
            >
              {showVertGrid || showHorzGrid ? (
                <Grid3X3 className="w-3.5 h-3.5 text-[#7C3AED]" />
              ) : (
                <Grid3X3Off className="w-3.5 h-3.5 text-[#897E9C] dark:text-[#71717A]" />
              )}
              <span className="text-[10px] font-semibold">Grid</span>
            </button>
          </div>
        )}

        {/* Bar & News Details Popup */}
        {clickedBar && (
          <div
            className="absolute z-30 bg-white dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] shadow-xl rounded-[6px] p-3 text-xs text-[#1A1325] dark:text-[#EDEDED] w-72 max-w-[calc(100vw-24px)] select-none animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.max(8, Math.min(clickedBar.x, (chartContainerRef.current?.clientWidth || 320) - 296)),
              top: Math.max(8, clickedBar.y),
            }}
          >
            <div className="flex items-center justify-between border-b border-[#F4EFFB] dark:border-[#1F1F24] pb-1.5 mb-2">
              <div className="flex items-center space-x-1.5 font-semibold text-[#1A1325] dark:text-[#EDEDED]">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Bar Interval ({clickedBar.duration})</span>
              </div>
              <button
                onClick={() => setClickedBar(null)}
                className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-0.5 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-[#897E9C] dark:text-[#71717A] block text-[10px]">Start Time (Pakistani Time PKT)</span>
                <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{clickedBar.startTime}</span>
              </div>
              <div>
                <span className="text-[#897E9C] dark:text-[#71717A] block text-[10px]">End Time (Pakistani Time PKT)</span>
                <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{clickedBar.endTime}</span>
              </div>
              <div className="border-t border-[#F4EFFB] dark:border-[#1F1F24] pt-1.5 flex justify-between text-[#5B526D] dark:text-[#A1A1AA]">
                <span>
                  Range: <strong className="text-[#1A1325] dark:text-[#EDEDED]">{clickedBar.rangePips} pips</strong>
                </span>
                <span>
                  Close: <strong className="text-[#1A1325] dark:text-[#EDEDED]">{ForexMath.formatPrice(clickedBar.close, pair.decimals)}</strong>
                </span>
              </div>

              {/* News Events at this exact candle */}
              {clickedBar.newsAtBar && clickedBar.newsAtBar.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#F4EFFB] dark:border-[#1F1F24] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center space-x-1">
                    <Newspaper className="w-3 h-3" />
                    <span>Forex Factory Release</span>
                  </span>

                  {clickedBar.newsAtBar.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-1.5 bg-[#FAF7FD] dark:bg-[#141418] rounded-[4px] border border-[#E8DEF4] dark:border-[#1F1F24] space-y-1 text-[10px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span
                            className="px-1 py-0.2 rounded font-bold text-[9px] text-white"
                            style={{ backgroundColor: ForexFactoryNewsService.getImpactColor(ev.impact) }}
                          >
                            {ForexFactoryNewsService.getImpactBadge(ev.impact)}
                          </span>
                          <span className="font-bold text-[#1A1325] dark:text-[#EDEDED]">{ev.country}</span>
                        </div>
                        <span className="text-[#897E9C] dark:text-[#71717A]">
                          {ForexMath.formatPakistaniTime(ev.timestamp, false)}
                        </span>
                      </div>
                      <div className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{ev.title}</div>
                      {(ev.actual || ev.forecast || ev.previous) && (
                        <div className="flex justify-between text-[#5B526D] dark:text-[#A1A1AA] pt-0.5">
                          <span>Act: {ev.actual || '—'}</span>
                          <span>Frcst: {ev.forecast || '—'}</span>
                          <span>Prev: {ev.previous || '—'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lightweight Charts Canvas Root */}
        <div ref={chartContainerRef} className="w-full flex-1 relative" />

        {/* DRAGGABLE SL / TP INTERACTIVE OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-20"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* 1. Drag & Drop for Active Open Positions */}
          {activePositionsWithCoords.map(
            ({ pos, yEntry, ySL, yTP, slPips, slDollar, tpPips, tpDollar }) => {
              const pipVal = ForexMath.getPipValuePerStandardLot(pair, pos.entryPrice) * pos.lotSize;

              return (
                <React.Fragment key={pos.id}>
                  {/* Entry Line Tag */}
                  {yEntry !== null && yEntry >= 0 && (
                    <div
                      className="absolute right-12 flex items-center space-x-1 pointer-events-auto"
                      style={{ top: `${yEntry - 12}px` }}
                    >
                      <div className="bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] shadow-sm flex items-center space-x-1">
                        <span>
                          {pos.type} {pos.lotSize}L
                        </span>
                        <span>@{ForexMath.formatPrice(pos.entryPrice, pair.decimals)}</span>
                      </div>

                      {/* If no SL set: Allow adding SL via drag */}
                      {!pos.stopLoss && (
                        <button
                          onPointerDown={(e) => {
                            const defaultSl =
                              pos.type === 'BUY'
                                ? pos.entryPrice - 20 * pair.pipSize
                                : pos.entryPrice + 20 * pair.pipSize;
                            handleStartDrag(e, 'POS_SL', pos.id, defaultSl, 20, 20 * pipVal);
                          }}
                          className="bg-[#F43F5E]/10 border border-[#F43F5E]/40 hover:bg-[#F43F5E] hover:text-white text-[#F43F5E] text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] transition-colors cursor-ns-resize flex items-center space-x-0.5"
                          title="Drag to add Stop Loss"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>SL</span>
                        </button>
                      )}

                      {/* If no TP set: Allow adding TP via drag */}
                      {!pos.takeProfit && (
                        <button
                          onPointerDown={(e) => {
                            const defaultTp =
                              pos.type === 'BUY'
                                ? pos.entryPrice + 40 * pair.pipSize
                                : pos.entryPrice - 40 * pair.pipSize;
                            handleStartDrag(e, 'POS_TP', pos.id, defaultTp, 40, 40 * pipVal);
                          }}
                          className="bg-[#10B981]/10 border border-[#10B981]/40 hover:bg-[#10B981] hover:text-white text-[#059669] text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] transition-colors cursor-ns-resize flex items-center space-x-0.5"
                          title="Drag to add Take Profit"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>TP</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* STOP LOSS DRAGGABLE LINE & BADGE (Follows Drag Live) */}
                  {pos.stopLoss && ySL !== null && ySL >= 0 && (
                    <div
                      className="absolute left-0 right-0 flex items-center pointer-events-none"
                      style={{ top: `${ySL}px` }}
                    >
                      {/* Visual Line */}
                      <div className="w-full border-b border-dashed border-[#F43F5E]" />

                      {/* Draggable Handle Badge */}
                      <div
                        onPointerDown={(e) =>
                          handleStartDrag(
                            e,
                            'POS_SL',
                            pos.id,
                            pos.stopLoss,
                            slPips,
                            slDollar
                          )
                        }
                        className="absolute right-12 -translate-y-1/2 pointer-events-auto bg-[#F43F5E] hover:bg-[#E11D48] text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] shadow-lg flex items-center space-x-1.5 cursor-ns-resize active:scale-95 transition-transform"
                        title="Click & Drag to adjust Stop Loss"
                      >
                        <GripVertical className="w-3 h-3 opacity-80" />
                        <span>SL {ForexMath.formatPrice(pos.stopLoss, pair.decimals)}</span>
                        <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight">
                          Loss: -${slDollar.toFixed(2)} (-{slPips.toFixed(1)}p)
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePositionSLTP?.(pos.id, undefined, pos.takeProfit);
                          }}
                          title="Remove Stop Loss"
                          className="hover:text-black/60 ml-0.5 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAKE PROFIT DRAGGABLE LINE & BADGE (Follows Drag Live) */}
                  {pos.takeProfit && yTP !== null && yTP >= 0 && (
                    <div
                      className="absolute left-0 right-0 flex items-center pointer-events-none"
                      style={{ top: `${yTP}px` }}
                    >
                      {/* Visual Line */}
                      <div className="w-full border-b border-dashed border-[#10B981]" />

                      {/* Draggable Handle Badge */}
                      <div
                        onPointerDown={(e) =>
                          handleStartDrag(
                            e,
                            'POS_TP',
                            pos.id,
                            pos.takeProfit,
                            tpPips,
                            tpDollar
                          )
                        }
                        className="absolute right-12 -translate-y-1/2 pointer-events-auto bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] shadow-lg flex items-center space-x-1.5 cursor-ns-resize active:scale-95 transition-transform"
                        title="Click & Drag to adjust Take Profit"
                      >
                        <GripVertical className="w-3 h-3 opacity-80" />
                        <span>TP {ForexMath.formatPrice(pos.takeProfit, pair.decimals)}</span>
                        <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight">
                          Profit: +${tpDollar.toFixed(2)} (+{tpPips.toFixed(1)}p)
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePositionSLTP?.(pos.id, pos.stopLoss, undefined);
                          }}
                          title="Remove Take Profit"
                          className="hover:text-black/60 ml-0.5 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            }
          )}

          {/* 2. Drag & Drop for Order Setup (When Opening Any Order) */}
          {orderSetupCoords && (
            <>
              {/* Setup Entry Preview Line */}
              {orderSetupCoords.yEntry !== null && orderSetupCoords.yEntry >= 0 && (
                <div
                  className="absolute left-0 right-0 flex items-center pointer-events-none"
                  style={{ top: `${orderSetupCoords.yEntry}px` }}
                >
                  <div className="w-full border-b border-dotted border-[#7C3AED]/70" />
                  <div className="absolute right-12 -translate-y-1/2 bg-[#7C3AED]/20 border border-[#7C3AED] text-[#7C3AED] text-[10px] font-bold px-2 py-0.5 rounded-[4px] shadow-xs">
                    Order Setup: {orderSetupCoords.type} {orderSetupCoords.lotSize}L @{' '}
                    {ForexMath.formatPrice(orderSetupCoords.entryPrice, pair.decimals)}
                  </div>
                </div>
              )}

              {/* Setup SL Preview Line & Draggable Badge */}
              {orderSetupCoords.ySL !== null && orderSetupCoords.ySL >= 0 && (
                <div
                  className="absolute left-0 right-0 flex items-center pointer-events-none"
                  style={{ top: `${orderSetupCoords.ySL}px` }}
                >
                  <div className="w-full border-b border-dashed border-[#F43F5E]" />
                  <div
                    onPointerDown={(e) =>
                      handleStartDrag(
                        e,
                        'SETUP_SL',
                        undefined,
                        orderSetupCoords.slPrice,
                        orderSetupCoords.slPips,
                        orderSetupCoords.slDollar
                      )
                    }
                    className="absolute right-12 -translate-y-1/2 pointer-events-auto bg-[#F43F5E] hover:bg-[#E11D48] text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] shadow-lg flex items-center space-x-1.5 cursor-ns-resize active:scale-95 transition-transform"
                    title="Drag to adjust Setup SL"
                  >
                    <GripVertical className="w-3 h-3 opacity-80" />
                    <span>Setup SL {ForexMath.formatPrice(orderSetupCoords.slPrice, pair.decimals)}</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight">
                      Loss: -${orderSetupCoords.slDollar.toFixed(2)} (-{orderSetupCoords.slPips.toFixed(1)}p)
                    </span>
                  </div>
                </div>
              )}

              {/* Setup TP Preview Line & Draggable Badge */}
              {orderSetupCoords.yTP !== null && orderSetupCoords.yTP >= 0 && (
                <div
                  className="absolute left-0 right-0 flex items-center pointer-events-none"
                  style={{ top: `${orderSetupCoords.yTP}px` }}
                >
                  <div className="w-full border-b border-dashed border-[#10B981]" />
                  <div
                    onPointerDown={(e) =>
                      handleStartDrag(
                        e,
                        'SETUP_TP',
                        undefined,
                        orderSetupCoords.tpPrice,
                        orderSetupCoords.tpPips,
                        orderSetupCoords.tpDollar
                      )
                    }
                    className="absolute right-12 -translate-y-1/2 pointer-events-auto bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] shadow-lg flex items-center space-x-1.5 cursor-ns-resize active:scale-95 transition-transform"
                    title="Drag to adjust Setup TP"
                  >
                    <GripVertical className="w-3 h-3 opacity-80" />
                    <span>Setup TP {ForexMath.formatPrice(orderSetupCoords.tpPrice, pair.decimals)}</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight">
                      Profit: +${orderSetupCoords.tpDollar.toFixed(2)} (+{orderSetupCoords.tpPips.toFixed(1)}p)
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. MID-MARKET LIVE CANDLE & LIVE PNL */}
          {openPositions.length > 0 && currentCandle && yMidMarket !== null && yMidMarket >= 0 && (
            <>
              {/* Mid-Market Price Level Line */}
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                style={{ top: `${yMidMarket}px` }}
              >
                <div
                  className={`w-full border-b ${
                    isOverallProfit ? 'border-[#10B981]/50 border-dashed' : 'border-[#F43F5E]/50 border-dashed'
                  }`}
                />
                <div
                  className={`absolute right-12 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold shadow-sm ${
                    isOverallProfit
                      ? 'bg-[#10B981]/20 border border-[#10B981] text-[#10B981]'
                      : 'bg-[#F43F5E]/20 border border-[#F43F5E] text-[#F43F5E]'
                  }`}
                >
                  <span>Mid {ForexMath.formatPrice(currentCandle.close, pair.decimals)}</span>
                  <span className="font-extrabold">
                    {isOverallProfit ? '+' : ''}${totalUnrealizedPnL.toFixed(2)} ({isOverallProfit ? '+' : ''}
                    {totalPips.toFixed(1)}p)
                  </span>
                </div>
              </div>

              {/* Floating Live Profit/Loss Badge Attached Directly to the Live Candle */}
              {xLiveCandle !== null && xLiveCandle >= 0 && (
                <div
                  className={`absolute -translate-y-1/2 z-25 pointer-events-none flex items-center space-x-1.5 px-2 py-1 rounded-[4px] font-bold text-[11px] shadow-xl border backdrop-blur-md transition-all ${
                    isOverallProfit
                      ? 'bg-[#10B981] border-[#059669] text-white'
                      : 'bg-[#F43F5E] border-[#E11D48] text-white'
                  }`}
                  style={{
                    left: `${Math.min(
                      Math.max(12, xLiveCandle + 12),
                      (chartContainerRef.current?.clientWidth || 400) - 150
                    )}px`,
                    top: `${yMidMarket}px`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                  <span>{isOverallProfit ? 'Profit' : 'Loss'}:</span>
                  <span className="font-black">
                    {isOverallProfit ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
                  </span>
                  <span className="text-[10px] opacity-90">
                    ({isOverallProfit ? '+' : ''}{totalPips.toFixed(1)}p)
                  </span>
                </div>
              )}
            </>
          )}

          {/* ACTIVE DRAGGING LIVE FLOATING TOOLTIP */}
          {dragState && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 z-40 text-white text-xs font-semibold px-3 py-1.5 rounded-[6px] shadow-2xl flex items-center space-x-2 pointer-events-none border animate-in fade-in zoom-in-95 duration-75 ${
                dragState.type.includes('SL')
                  ? 'bg-[#180A0E] border-[#F43F5E]'
                  : 'bg-[#0A1812] border-[#10B981]'
              }`}
              style={{
                top: `${dragState.tooltipY}px`,
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dragState.type.includes('SL') ? 'bg-[#F43F5E]' : 'bg-[#10B981]'
                }`}
              />
              <span>
                {dragState.type.includes('SL') ? 'Stop Loss' : 'Take Profit'}:{' '}
                {ForexMath.formatPrice(dragState.currentPrice, pair.decimals)}
              </span>
              <span
                className={`font-black ${
                  dragState.type.includes('SL') ? 'text-[#F43F5E]' : 'text-[#10B981]'
                }`}
              >
                {dragState.type.includes('SL')
                  ? `Loss: -$${dragState.dollarVal.toFixed(2)} (-${dragState.pips.toFixed(1)}p)`
                  : `Profit: +$${dragState.dollarVal.toFixed(2)} (+${dragState.pips.toFixed(1)}p)`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
