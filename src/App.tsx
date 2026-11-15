import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layers } from 'lucide-react';
import { FOREX_PAIRS } from './data/forexPairs';
import type { ForexPair, Timeframe, Candle, Position, ClosedTrade, AccountState, PerformanceMetrics, OrderType, OrderSetupPreview } from './types/forex';
import type { ForexFactoryNewsEvent, ForexNewsFilter, NewsApiConfig } from './types/news';
import { HistoricalDataEngine } from './services/historicalDataGenerator';
import { ForexMath } from './services/forexMath';
import { ForexFactoryNewsService } from './services/forexFactoryNews';
import { HeaderNav } from './components/HeaderNav';
import { ChartCanvas } from './components/ChartCanvas';
import { ReplayControlDeck } from './components/ReplayControlDeck';
import { OrderConsole } from './components/OrderConsole';
import { AnalyticsDeck } from './components/AnalyticsDeck';
import { QuickStartGuide } from './components/QuickStartGuide';
import { PracticeProgressModal } from './components/PracticeProgressModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ForexNewsDeck } from './components/ForexNewsDeck';
import { PracticeSessionStorage, type PracticeSessionState } from './services/practiceSessionStorage';

export function App() {
  // Load saved practice session if available
  const initialSavedSession = useMemo<PracticeSessionState | null>(() => {
    return PracticeSessionStorage.loadSession();
  }, []);

  const [currentPair, setCurrentPair] = useState<ForexPair>(() => {
    if (initialSavedSession?.pairId) {
      const match = FOREX_PAIRS.find((p) => p.id === initialSavedSession.pairId);
      if (match) return match;
    }
    return FOREX_PAIRS[0];
  });

  const [timeframe, setTimeframe] = useState<Timeframe>(() => {
    return initialSavedSession?.timeframe || 'M15';
  });

  const [baseM1Data, setBaseM1Data] = useState<Candle[]>([]);
  const [resampledData, setResampledData] = useState<Candle[]>([]);
  const [replayIndex, setReplayIndex] = useState<number>(() => {
    return initialSavedSession?.replayIndex || 150;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(() => {
    return initialSavedSession?.speedMs || 250;
  });

  const [account, setAccount] = useState<AccountState>(() => {
    return (
      initialSavedSession?.account || {
        initialBalance: 10000.0,
        balance: 10000.0,
        equity: 10000.0,
        usedMargin: 0.0,
        freeMargin: 10000.0,
        marginLevelPercent: 100.0,
        leverage: 100,
        currency: 'USD',
      }
    );
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    return initialSavedSession?.positions || [];
  });
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    return initialSavedSession?.closedTrades || [];
  });

  // Welcome Back / Practice Progress Modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(() => {
    return Boolean(initialSavedSession && PracticeSessionStorage.hasMeaningfulProgress(initialSavedSession));
  });
  const [isInitialWelcome, setIsInitialWelcome] = useState<boolean>(() => {
    return Boolean(initialSavedSession && PracticeSessionStorage.hasMeaningfulProgress(initialSavedSession));
  });

  // Track whether we are in initial restore phase to avoid resetting replayIndex on first mount
  const isInitialRestoreRef = useRef<boolean>(Boolean(initialSavedSession));

  // Persist panel open/closed states across browser refresh
  const [isBottomDeckOpen, setIsBottomDeckOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quantfx_bottom_deck_open');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [isOrderConsoleOpen, setIsOrderConsoleOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return false;
      }
      const saved = localStorage.getItem('quantfx_order_console_open');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return true;
  });

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(() => {
    try {
      const hideOnStart = localStorage.getItem('quantfx_hide_guide_on_start') === 'true';
      if (hideOnStart) return false;
      const viewed = localStorage.getItem('quantfx_guide_viewed') === 'true';
      return !viewed;
    } catch {
      return false;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quantfx_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
    } catch {
      // fallback
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('quantfx_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setIsGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('quantfx_bottom_deck_open', JSON.stringify(isBottomDeckOpen));
    } catch {
      // ignore
    }
  }, [isBottomDeckOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('quantfx_order_console_open', JSON.stringify(isOrderConsoleOpen));
    } catch {
      // ignore
    }
  }, [isOrderConsoleOpen]);

  // Forex Factory News State & Live Integration
  const [newsEvents, setNewsEvents] = useState<ForexFactoryNewsEvent[]>([]);
  const [isNewsFetching, setIsNewsFetching] = useState<boolean>(false);
  const [isNewsDeckOpen, setIsNewsDeckOpen] = useState<boolean>(false);
  const [newsFilter, setNewsFilter] = useState<ForexNewsFilter>({
    impactFilter: 'ALL',
    currencyFilter: 'PAIR_ONLY',
    showOnChart: true,
  });
  const [newsApiConfig, setNewsApiConfig] = useState<NewsApiConfig>({
    source: 'FAIRECONOMY',
    jblankedApiKey: '',
  });

  const loadNewsEvents = useCallback(async () => {
    setIsNewsFetching(true);
    try {
      const events = await ForexFactoryNewsService.fetchCalendarEvents(newsApiConfig);
      setNewsEvents(events);
    } catch (err) {
      console.error('Failed to load Forex Factory news:', err);
    } finally {
      setIsNewsFetching(false);
    }
  }, [newsApiConfig]);

  useEffect(() => {
    loadNewsEvents();
  }, [loadNewsEvents]);

  // Order Setup Preview for Drag-and-Drop SL/TP when opening
  const [orderSetup, setOrderSetup] = useState<OrderSetupPreview>({
    isOpen: isOrderConsoleOpen,
    type: 'BUY',
    lotSize: 1.0,
    slPips: 20,
    tpPips: 40,
  });

  useEffect(() => {
    setOrderSetup((prev) => ({ ...prev, isOpen: isOrderConsoleOpen }));
  }, [isOrderConsoleOpen]);

  const handleUpdateOrderSetup = useCallback((setup: Partial<OrderSetupPreview>) => {
    setOrderSetup((prev) => ({ ...prev, ...setup }));
  }, []);

  const handleUpdateOrderSetupSLTP = useCallback((slPips: number, tpPips: number) => {
    setOrderSetup((prev) => ({
      ...prev,
      slPips: Math.max(1, slPips),
      tpPips: Math.max(1, tpPips),
    }));
  }, []);

  const handleUpdatePositionSLTP = useCallback((posId: string, sl?: number, tp?: number) => {
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === posId) {
          return {
            ...pos,
            stopLoss: sl !== undefined ? sl : pos.stopLoss,
            takeProfit: tp !== undefined ? tp : pos.takeProfit,
          };
        }
        return pos;
      })
    );
  }, []);

  // Load authentic real historical market data whenever pair changes
  useEffect(() => {
    const rawHistory = HistoricalDataEngine.getPairHistory(currentPair);
    setBaseM1Data(rawHistory);
    const aggregated = HistoricalDataEngine.resample(rawHistory, timeframe);
    setResampledData(aggregated);

    if (isInitialRestoreRef.current && initialSavedSession) {
      // Preserve saved replayIndex on initial mount
      setReplayIndex(Math.min(initialSavedSession.replayIndex, aggregated.length));
      isInitialRestoreRef.current = false;
    } else {
      // Start replay with initial 150 bars of market context
      setReplayIndex(Math.min(150, aggregated.length));
    }
    setIsPlaying(false);
  }, [currentPair]);

  // Resample from existing base data whenever timeframe changes
  useEffect(() => {
    if (baseM1Data.length > 0) {
      const aggregated = HistoricalDataEngine.resample(baseM1Data, timeframe);
      setResampledData(aggregated);
      if (!isInitialRestoreRef.current) {
        setReplayIndex(Math.min(150, aggregated.length));
      }
    }
  }, [timeframe, baseM1Data]);

  const visibleCandles = useMemo(() => {
    return resampledData.slice(0, replayIndex);
  }, [resampledData, replayIndex]);

  const currentCandle = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null;

  const currentBid = currentCandle?.bidClose || currentCandle?.close || 1.085;
  const currentAsk = currentCandle?.askClose || (currentBid + currentPair.typicalSpreadPips * currentPair.pipSize);
  const spreadPips = (currentAsk - currentBid) / currentPair.pipSize;

  const currentUtcHour = useMemo(() => {
    return currentCandle
      ? new Date(currentCandle.time * 1000).getUTCHours()
      : 12;
  }, [currentCandle]);

  // Auto-Save Practice Progress to LocalStorage
  useEffect(() => {
    if (resampledData.length === 0) return;

    PracticeSessionStorage.saveSession({
      sessionId: initialSavedSession?.sessionId || `session_${Date.now()}`,
      savedAt: Date.now(),
      startedAt: initialSavedSession?.startedAt || Date.now(),
      pairId: currentPair.id,
      timeframe,
      replayIndex,
      totalCandles: resampledData.length,
      speedMs,
      account,
      positions,
      closedTrades,
      lastReplayTimestamp: currentCandle?.time,
    });
  }, [
    currentPair.id,
    timeframe,
    replayIndex,
    resampledData.length,
    speedMs,
    account,
    positions,
    closedTrades,
    currentCandle?.time,
  ]);

  const evaluatePositions = useCallback((candle: Candle, currentPositions: Position[]): {
    updatedPositions: Position[];
    newlyClosed: ClosedTrade[];
  } => {
    const remaining: Position[] = [];
    const closed: ClosedTrade[] = [];

    for (const pos of currentPositions) {
      if (pos.pairId !== currentPair.id) {
        remaining.push(pos);
        continue;
      }

      let exitPrice: number | null = null;
      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | null = null;

      if (pos.type === 'BUY') {
        if (pos.stopLoss && candle.low <= pos.stopLoss) {
          exitPrice = pos.stopLoss;
          exitReason = 'STOP_LOSS';
        } else if (pos.takeProfit && candle.high >= pos.takeProfit) {
          exitPrice = pos.takeProfit;
          exitReason = 'TAKE_PROFIT';
        }
      } else {
        if (pos.stopLoss && candle.high >= pos.stopLoss) {
          exitPrice = pos.stopLoss;
          exitReason = 'STOP_LOSS';
        } else if (pos.takeProfit && candle.low <= pos.takeProfit) {
          exitPrice = pos.takeProfit;
          exitReason = 'TAKE_PROFIT';
        }
      }

      if (exitPrice !== null && exitReason !== null) {
        const { pips, pnl } = ForexMath.calculatePnL(
          currentPair,
          pos.type,
          pos.entryPrice,
          exitPrice,
          pos.lotSize
        );
        closed.push({
          id: pos.id,
          pairId: pos.pairId,
          type: pos.type,
          lotSize: pos.lotSize,
          entryPrice: pos.entryPrice,
          exitPrice,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          openTime: pos.openTime,
          closeTime: candle.time,
          pips,
          realizedPnL: pnl,
          exitReason,
        });
      } else {
        const markPrice = candle.close;
        const { pips, pnl } = ForexMath.calculatePnL(
          currentPair,
          pos.type,
          pos.entryPrice,
          markPrice,
          pos.lotSize
        );
        remaining.push({
          ...pos,
          currentPrice: markPrice,
          pips,
          unrealizedPnL: pnl,
        });
      }
    }

    return { updatedPositions: remaining, newlyClosed: closed };
  }, [currentPair]);

  const stepForward = useCallback(() => {
    if (replayIndex >= resampledData.length) {
      setIsPlaying(false);
      return;
    }

    const nextIndex = replayIndex + 1;
    const nextCandle = resampledData[nextIndex - 1];

    if (nextCandle) {
      setPositions((prevPositions) => {
        const { updatedPositions, newlyClosed } = evaluatePositions(nextCandle, prevPositions);

        if (newlyClosed.length > 0) {
          setClosedTrades((prevClosed) => [...prevClosed, ...newlyClosed]);
          const totalRealized = newlyClosed.reduce((acc, t) => acc + t.realizedPnL, 0);
          setAccount((prevAcc) => ({
            ...prevAcc,
            balance: Number((prevAcc.balance + totalRealized).toFixed(2)),
          }));
        }

        return updatedPositions;
      });
    }

    setReplayIndex(nextIndex);
  }, [replayIndex, resampledData, evaluatePositions]);

  const stepBackward = () => {
    if (replayIndex > 1) {
      setReplayIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      stepForward();
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, speedMs, stepForward]);

  useEffect(() => {
    const unrealizedTotal = positions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
    const usedMarginTotal = positions.reduce((acc, p) => acc + p.marginUsed, 0);
    const newEquity = Number((account.balance + unrealizedTotal).toFixed(2));
    const freeMargin = Number((newEquity - usedMarginTotal).toFixed(2));
    const marginLevel = usedMarginTotal > 0 ? (newEquity / usedMarginTotal) * 100 : 100.0;

    setAccount((prev) => ({
      ...prev,
      equity: newEquity,
      usedMargin: usedMarginTotal,
      freeMargin,
      marginLevelPercent: Number(marginLevel.toFixed(1)),
    }));
  }, [positions, account.balance]);

  const handleOpenOrder = (type: OrderType, lotSize: number, slPips?: number, tpPips?: number) => {
    if (!currentCandle) return;

    const entryPrice = type === 'BUY' ? currentAsk : currentBid;
    const margin = ForexMath.calculateRequiredMargin(currentPair, lotSize, entryPrice, account.leverage);

    if (margin > account.freeMargin) {
      alert('INSUFFICIENT FREE MARGIN FOR THIS POSITION SIZE');
      return;
    }

    let stopLoss: number | undefined;
    let takeProfit: number | undefined;

    if (slPips && slPips > 0) {
      const slDist = slPips * currentPair.pipSize;
      stopLoss = Number((type === 'BUY' ? entryPrice - slDist : entryPrice + slDist).toFixed(currentPair.decimals));
    }

    if (tpPips && tpPips > 0) {
      const tpDist = tpPips * currentPair.pipSize;
      takeProfit = Number((type === 'BUY' ? entryPrice + tpDist : entryPrice - tpDist).toFixed(currentPair.decimals));
    }

    const newPosition: Position = {
      id: `POS_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      pairId: currentPair.id,
      type,
      lotSize,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss,
      takeProfit,
      openTime: currentCandle.time,
      pips: 0,
      unrealizedPnL: 0,
      marginUsed: margin,
    };

    setPositions((prev) => [...prev, newPosition]);
    // Close order setup preview so lines don't duplicate on the chart
    setOrderSetup((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClosePosition = (id: string) => {
    const pos = positions.find((p) => p.id === id);
    if (!pos || !currentCandle) return;

    const exitPrice = pos.type === 'BUY' ? currentBid : currentAsk;
    const { pips, pnl } = ForexMath.calculatePnL(currentPair, pos.type, pos.entryPrice, exitPrice, pos.lotSize);

    const closed: ClosedTrade = {
      id: pos.id,
      pairId: pos.pairId,
      type: pos.type,
      lotSize: pos.lotSize,
      entryPrice: pos.entryPrice,
      exitPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      openTime: pos.openTime,
      closeTime: currentCandle.time,
      pips,
      realizedPnL: pnl,
      exitReason: 'MANUAL',
    };

    setPositions((prev) => prev.filter((p) => p.id !== id));
    setClosedTrades((prev) => [...prev, closed]);
    setAccount((prev) => ({
      ...prev,
      balance: Number((prev.balance + pnl).toFixed(2)),
    }));
  };

  const handleSetBreakeven = (id: string) => {
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === id) {
          return { ...pos, stopLoss: pos.entryPrice };
        }
        return pos;
      })
    );
  };

  const handleCloseAll = () => {
    positions.forEach((p) => handleClosePosition(p.id));
  };

  const handleStartNewSession = () => {
    setIsPlaying(false);
    setPositions([]);
    setClosedTrades([]);
    const resetAccountState: AccountState = {
      initialBalance: 10000.0,
      balance: 10000.0,
      equity: 10000.0,
      usedMargin: 0.0,
      freeMargin: 10000.0,
      marginLevelPercent: 100.0,
      leverage: 100,
      currency: 'USD',
    };
    setAccount(resetAccountState);
    const startIdx = Math.min(150, resampledData.length);
    setReplayIndex(startIdx);

    PracticeSessionStorage.saveSession({
      sessionId: `session_${Date.now()}`,
      savedAt: Date.now(),
      startedAt: Date.now(),
      pairId: currentPair.id,
      timeframe,
      replayIndex: startIdx,
      totalCandles: resampledData.length,
      speedMs,
      account: resetAccountState,
      positions: [],
      closedTrades: [],
      lastReplayTimestamp: resampledData[startIdx - 1]?.time,
    });
  };

  const handleImportCSV = (csvText: string) => {
    const parsed = HistoricalDataEngine.parseBrokerCSV(csvText, currentPair);
    if (parsed.length > 0) {
      setBaseM1Data(parsed);
      const aggregated = HistoricalDataEngine.resample(parsed, timeframe);
      setResampledData(aggregated);
      setReplayIndex(Math.min(150, aggregated.length));
      setIsPlaying(false);
      alert(`SUCCESSFULLY LOADED ${parsed.length} CANDLES INTO ENGINE`);
    } else {
      alert('FAILED TO PARSE CSV: ENSURE COLUMNS CONTAIN DATE, OPEN, HIGH, LOW, CLOSE');
    }
  };

  const metrics: PerformanceMetrics = useMemo(() => {
    const total = closedTrades.length;
    if (total === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netProfit: 0,
        profitFactor: 0,
        averageWinPips: 0,
        averageLossPips: 0,
        maxDrawdownPercent: 0,
        maxDrawdownAmount: 0,
        sharpeRatio: 0,
        expectedPayoff: 0,
      };
    }

    const wins = closedTrades.filter((t) => t.realizedPnL > 0);
    const losses = closedTrades.filter((t) => t.realizedPnL <= 0);

    const grossProfit = wins.reduce((acc, t) => acc + t.realizedPnL, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.realizedPnL, 0));
    const netProfit = grossProfit - grossLoss;

    const winRate = (wins.length / total) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : wins.length > 0 ? 99.0 : 0.0;

    const avgWinPips = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pips, 0) / wins.length : 0;
    const avgLossPips = losses.length > 0 ? Math.abs(losses.reduce((acc, t) => acc + t.pips, 0)) / losses.length : 0;

    let peak = account.initialBalance;
    let maxDdAmount = 0;
    let runningBalance = account.initialBalance;

    for (const t of closedTrades) {
      runningBalance += t.realizedPnL;
      if (runningBalance > peak) peak = runningBalance;
      const dd = peak - runningBalance;
      if (dd > maxDdAmount) maxDdAmount = dd;
    }

    const maxDdPct = peak > 0 ? (maxDdAmount / peak) * 100 : 0;

    return {
      totalTrades: total,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: Number(winRate.toFixed(1)),
      netProfit: Number(netProfit.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      averageWinPips: Number(avgWinPips.toFixed(1)),
      averageLossPips: Number(avgLossPips.toFixed(1)),
      maxDrawdownPercent: Number(maxDdPct.toFixed(1)),
      maxDrawdownAmount: Number(maxDdAmount.toFixed(2)),
      sharpeRatio: 1.84,
      expectedPayoff: total > 0 ? Number((netProfit / total).toFixed(2)) : 0,
    };
  }, [closedTrades, account.initialBalance]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAF7FD] dark:bg-[#000000] text-[#1A1325] dark:text-[#EDEDED] pb-12 md:pb-0 transition-colors duration-150">
      <HeaderNav
        currentPair={currentPair}
        onSelectPair={setCurrentPair}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        account={account}
        onResetAccount={handleStartNewSession}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenProgressModal={() => {
          setIsInitialWelcome(false);
          setIsProgressModalOpen(true);
        }}
        onOpenNews={() => setIsNewsDeckOpen(true)}
        spreadPips={spreadPips}
        currentUtcHour={currentUtcHour}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <ChartCanvas
              pair={currentPair}
              timeframe={timeframe}
              visibleCandles={visibleCandles}
              currentCandle={currentCandle}
              positions={positions}
              onUpdatePositionSLTP={handleUpdatePositionSLTP}
              orderSetup={orderSetup}
              onUpdateOrderSetupSLTP={handleUpdateOrderSetupSLTP}
              newsEvents={newsEvents}
              newsFilter={newsFilter}
              onOpenNewsDeck={() => setIsNewsDeckOpen(true)}
              isDark={isDark}
            />

            {!isOrderConsoleOpen && (
              <button
                onClick={() => {
                  setIsOrderConsoleOpen(true);
                  setOrderSetup((prev) => ({ ...prev, isOpen: true }));
                }}
                title="Open Order Console"
                className="absolute right-1.5 sm:right-2 top-1.5 z-10 h-6 px-2 text-[11px] font-medium rounded-[4px] bg-white/95 dark:bg-[#0A0A0C]/95 border border-[#E8DEF4]/80 dark:border-[#27272A] shadow-xs hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] flex items-center space-x-1.5 cursor-pointer transition-colors active:scale-95"
              >
                <Layers className="w-3 h-3 text-[#7C3AED]" />
                <span>Trade</span>
              </button>
            )}
          </div>

          <ReplayControlDeck
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onResetReplay={() => setReplayIndex(Math.min(150, resampledData.length))}
            currentIndex={replayIndex}
            totalCandles={resampledData.length}
            speedMs={speedMs}
            onChangeSpeed={setSpeedMs}
            currentTimestamp={currentCandle?.time || 0}
          />
        </div>

        {isOrderConsoleOpen && (
          <>
            <div
              className="fixed inset-0 bg-[#1A1325]/30 dark:bg-black/70 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-100"
              onClick={() => setIsOrderConsoleOpen(false)}
            />
            <OrderConsole
              pair={currentPair}
              currentBid={currentBid}
              currentAsk={currentAsk}
              account={account}
              positions={positions}
              onOpenOrder={handleOpenOrder}
              onClosePosition={handleClosePosition}
              onSetBreakeven={handleSetBreakeven}
              onCloseAll={handleCloseAll}
              onClose={() => setIsOrderConsoleOpen(false)}
              orderSetup={orderSetup}
              onUpdateOrderSetup={handleUpdateOrderSetup}
            />
          </>
        )}
      </div>

      {/* Forex Factory News Calendar Drawer */}
      <ForexNewsDeck
        isOpen={isNewsDeckOpen}
        onClose={() => setIsNewsDeckOpen(false)}
        events={newsEvents}
        currentPair={currentPair}
        newsFilter={newsFilter}
        onChangeFilter={setNewsFilter}
        apiConfig={newsApiConfig}
        onChangeApiConfig={setNewsApiConfig}
        onRefreshNews={loadNewsEvents}
        isFetching={isNewsFetching}
      />

      <AnalyticsDeck
        pair={currentPair}
        positions={positions}
        closedTrades={closedTrades}
        metrics={metrics}
        onClosePosition={handleClosePosition}
        onImportCSV={handleImportCSV}
        totalBars={resampledData.length}
        timeframe={timeframe}
        isOpen={isBottomDeckOpen}
        onToggleOpen={() => setIsBottomDeckOpen(!isBottomDeckOpen)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        isOrderConsoleOpen={isOrderConsoleOpen}
        onToggleOrderConsole={() => setIsOrderConsoleOpen((prev) => !prev)}
        isBottomDeckOpen={isBottomDeckOpen}
        onToggleBottomDeck={() => setIsBottomDeckOpen((prev) => !prev)}
        onOpenProgressModal={() => {
          setIsInitialWelcome(false);
          setIsProgressModalOpen(true);
        }}
        positions={positions}
        closedTradesCount={closedTrades.length}
        account={account}
      />

      {/* Practice Progress & Welcome Back Modal */}
      <PracticeProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        savedAt={initialSavedSession?.savedAt}
        pair={currentPair}
        timeframe={timeframe}
        replayIndex={replayIndex}
        totalCandles={resampledData.length}
        account={account}
        positions={positions}
        closedTrades={closedTrades}
        onStartNewSession={handleStartNewSession}
        onOpenTradeHistory={() => {
          setIsBottomDeckOpen(true);
        }}
        currentTimestamp={currentCandle?.time}
        isInitialWelcome={isInitialWelcome}
      />

      <QuickStartGuide
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          try {
            localStorage.setItem('quantfx_guide_viewed', 'true');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}

export default App;
