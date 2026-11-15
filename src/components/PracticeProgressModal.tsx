import React from 'react';
import {
  X,
  Clock,
  RotateCcw,
  Play,
  ArrowRight,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { AccountState, ClosedTrade, ForexPair, Position, Timeframe } from '../types/forex';
import { ForexMath } from '../services/forexMath';
import { PracticeSessionStorage } from '../services/practiceSessionStorage';

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
  savedAt,
  pair,
  timeframe,
  replayIndex,
  totalCandles,
  account,
  positions,
  closedTrades,
  onStartNewSession,
  onOpenTradeHistory,
  currentTimestamp,
  isInitialWelcome = false,
}) => {
  if (!isOpen) return null;

  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter((t) => t.realizedPnL > 0).length;
  const losses = closedTrades.filter((t) => t.realizedPnL <= 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const netProfit = Number((account.balance - account.initialBalance).toFixed(2));
  const netProfitPct = ((netProfit / account.initialBalance) * 100).toFixed(2);
  const isProfitable = netProfit >= 0;

  const relativeTime = savedAt ? PracticeSessionStorage.formatRelativeTime(savedAt) : 'Recent';
  const progressPercent = totalCandles > 0 ? ((replayIndex / totalCandles) * 100).toFixed(1) : '0';

  const marketTimeFormatted = currentTimestamp
    ? ForexMath.formatPakistaniTime(currentTimestamp, true)
    : 'Standby';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1325]/50 dark:bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#000000] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[10px] shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-[#1A1325] dark:text-[#EDEDED] overflow-hidden animate-in zoom-in-95 duration-150 transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-[#E8DEF4] dark:border-[#1F1F24] px-4 sm:px-5 flex items-center justify-between bg-[#FAF7FD] dark:bg-[#050507]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A1325] dark:text-[#EDEDED] tracking-tight">
                {isInitialWelcome ? 'Welcome Back • Practice Resumed' : 'Your Practice Progress'}
              </h2>
              <p className="text-[11px] text-[#897E9C] dark:text-[#71717A]">
                Last practice state saved {relativeTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-1.5 rounded-[6px] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Status Alert Banner */}
          <div className="bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[8px] p-3 text-xs flex items-start space-x-2.5">
            <Clock className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] block">
                Practice Session Active
              </span>
              <span className="text-[#5B526D] dark:text-[#A1A1AA] text-[11px] leading-relaxed">
                Everything is saved right where you left off. You can step candles, take new trades, or review your historical performance.
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Account Balance */}
            <div className="ai-card p-3 flex flex-col">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#897E9C] dark:text-[#71717A]">
                Current Balance
              </span>
              <span className="text-base font-bold text-[#1A1325] dark:text-[#EDEDED] tabular-figures mt-0.5">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] mt-0.5">
                Initial: ${account.initialBalance.toLocaleString('en-US')}
              </span>
            </div>

            {/* Net P&L */}
            <div className="ai-card p-3 flex flex-col">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#897E9C] dark:text-[#71717A]">
                Net Profit / Loss
              </span>
              <div className="flex items-center space-x-1 mt-0.5">
                {isProfitable ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[#F43F5E]" />
                )}
                <span
                  className={`text-base font-bold tabular-figures ${
                    isProfitable ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'
                  }`}
                >
                  {isProfitable ? '+' : ''}${netProfit.toFixed(2)}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold mt-0.5 ${
                  isProfitable ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'
                }`}
              >
                {isProfitable ? '+' : ''}{netProfitPct}% Return
              </span>
            </div>

            {/* Win Rate */}
            <div className="ai-card p-3 flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#897E9C] dark:text-[#71717A]">
                Win Rate
              </span>
              <span className="text-base font-bold text-[#1A1325] dark:text-[#EDEDED] tabular-figures mt-0.5">
                {winRate}%
              </span>
              <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] mt-0.5">
                {wins}W / {losses}L ({totalTrades} Total)
              </span>
            </div>
          </div>

          {/* Where You Left Off Detail Card */}
          <div className="ai-card p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold text-[#1A1325] dark:text-[#EDEDED] uppercase tracking-wider">
              Where You Left Off
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-2">
                <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] block">Instrument & Timeframe</span>
                <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] text-xs">
                  {pair.symbol} <span className="text-[#7C3AED]">({timeframe})</span>
                </span>
              </div>

              <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-2">
                <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] block">Replay Progress</span>
                <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] text-xs tabular-figures">
                  Bar {replayIndex} of {totalCandles} ({progressPercent}%)
                </span>
              </div>
            </div>

            <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-2 text-xs flex justify-between items-center">
              <span className="text-[#897E9C] dark:text-[#71717A]">Market Date & Time:</span>
              <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures">
                {marketTimeFormatted}
              </span>
            </div>

            {/* Active Open Positions Status */}
            <div className="border-t border-[#E8DEF4] dark:border-[#1F1F24] pt-2 flex items-center justify-between text-xs">
              <span className="text-[#5B526D] dark:text-[#A1A1AA]">Active Open Positions:</span>
              <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">
                {positions.length > 0 ? (
                  <span className="text-[#7C3AED]">{positions.length} Trade{positions.length > 1 ? 's' : ''} Open</span>
                ) : (
                  <span className="text-[#897E9C] dark:text-[#71717A]">No open positions</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:px-5 border-t border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#050507] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to start a new practice session? Your current session will be reset to $10,000 balance.')) {
                  onStartNewSession();
                  onClose();
                }
              }}
              title="Reset account and restart practice from bar 1"
              className="w-full sm:w-auto text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-3 py-2 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </button>

            {totalTrades > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTradeHistory();
                }}
                className="w-full sm:w-auto text-[#7C3AED] hover:text-[#6D28D9] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-3 py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>View Trade Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Continue Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
