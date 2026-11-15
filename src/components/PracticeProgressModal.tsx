import React from 'react';
import { X, Play, RotateCcw, ArrowRight } from 'lucide-react';
import type { AccountState, ClosedTrade, ForexPair, Position, Timeframe } from '../types/forex';

interface PracticeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAt?: number;
  pair: ForexPair;
  timeframe: Timeframe;
  replayIndex: number;
  totalCandles: number;
  account: AccountState;
  positions: Position[];
  closedTrades: ClosedTrade[];
  onStartNewSession: () => void;
  onOpenTradeHistory: () => void;
  currentTimestamp?: number;
  isInitialWelcome?: boolean;
}

export const PracticeProgressModal: React.FC<PracticeProgressModalProps> = ({
  isOpen,
  onClose,
  pair,
  timeframe,
  replayIndex,
  totalCandles,
  account,
  positions,
  closedTrades,
  onStartNewSession,
  onOpenTradeHistory,
  isInitialWelcome = false,
}) => {
  if (!isOpen) return null;

  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter((t) => t.realizedPnL > 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(0) : '0';
  const netProfit = Number((account.balance - account.initialBalance).toFixed(2));
  const netProfitPct = ((netProfit / account.initialBalance) * 100).toFixed(2);
  const isProfitable = netProfit >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl p-7 sm:p-8 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#D946EF] text-white shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title and Close Button */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isInitialWelcome ? 'Welcome Back' : 'Practice Session'}
            </h2>
            <p className="text-xs text-white/80 mt-1 font-medium">
              {pair.symbol} {timeframe}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Hero Balance and Net Return */}
        <div className="my-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 block">
            Balance
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-figures mt-1">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1.5 text-sm font-semibold flex items-center gap-2">
            <span className={isProfitable ? 'text-emerald-300' : 'text-rose-300'}>
              {isProfitable ? '+' : ''}${netProfit.toFixed(2)} ({isProfitable ? '+' : ''}{netProfitPct}%)
            </span>
          </div>
        </div>

        {/* Minimal Metrics Row - Clean text and numbers, no nested card boxes, no dots */}
        <div className="flex items-center justify-between py-3 border-t border-white/20 text-xs text-white/90">
          <div>
            <span className="text-white/60">Win Rate </span>
            <span className="font-semibold">{winRate}%</span>
          </div>
          <div>
            <span className="text-white/60">Replay </span>
            <span className="font-semibold tabular-figures">Bar {replayIndex} of {totalCandles}</span>
          </div>
          {positions.length > 0 && (
            <div>
              <span className="font-semibold text-amber-200">{positions.length} Active</span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 bg-white text-purple-950 hover:bg-white/90 font-semibold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Continue Practice</span>
        </button>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={() => {
              if (window.confirm('Start a new session? Current practice progress will be reset.')) {
                onStartNewSession();
                onClose();
              }
            }}
            className="text-xs text-white/75 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>

          {totalTrades > 0 && (
            <button
              onClick={() => {
                onClose();
                onOpenTradeHistory();
              }}
              className="text-xs text-white/75 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Trade Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
