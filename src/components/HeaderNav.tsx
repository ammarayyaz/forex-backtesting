import React from 'react';
import type { ForexPair, Timeframe, AccountState } from '../types/forex';
import { FOREX_PAIRS, SESSIONS } from '../data/forexPairs';
import { RotateCcw, BookOpen, History, Moon, Sun, Newspaper } from 'lucide-react';

interface HeaderNavProps {
  currentPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  account: AccountState;
  onResetAccount: () => void;
  onOpenGuide: () => void;
  onOpenProgressModal?: () => void;
  onOpenNews?: () => void;
  spreadPips: number;
  currentUtcHour: number;
  closedTradesCount?: number;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPair,
  onSelectPair,
  timeframe,
  onSelectTimeframe,
  account,
  onResetAccount,
  onOpenGuide,
  onOpenProgressModal,
  onOpenNews,
  spreadPips,
  currentUtcHour,
  isDark = false,
  onToggleTheme,
}) => {
  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  const isSessionActive = (open: number, close: number) => {
    if (open > close) {
      return currentUtcHour >= open || currentUtcHour < close;
    }
    return currentUtcHour >= open && currentUtcHour < close;
  };

  const netProfit = account.balance - account.initialBalance;
  const isProfitable = netProfit >= 0;

  return (
    <header className="h-9 bg-white dark:bg-[#000000] border-b border-[#E8DEF4]/80 dark:border-[#1F1F24] px-2 sm:px-3 flex items-center justify-between select-none text-[#1A1325] dark:text-[#EDEDED] touch-manipulation transition-colors duration-150">
      {/* Brand & Pair Selector */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <div className="flex items-center font-bold tracking-tight text-xs text-[#1A1325] dark:text-[#EDEDED]">
          <span className="text-[#7C3AED]">QuantFX</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#E8DEF4] dark:bg-[#1F1F24]" />

        {/* Currency Pair Dropdown */}
        <select
          value={currentPair.id}
          onChange={(e) => {
            const pair = FOREX_PAIRS.find((p) => p.id === e.target.value);
            if (pair) onSelectPair(pair);
          }}
          className="h-6.5 bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] px-2 py-0 text-[11px] font-semibold focus:outline-none focus:border-[#7C3AED] cursor-pointer max-w-[92px] xs:max-w-[108px] sm:max-w-none transition-colors"
        >
          <optgroup label="Majors">
            {FOREX_PAIRS.filter((p) => p.category === 'MAJOR').map((p) => (
              <option key={p.id} value={p.id}>
                {p.symbol}
              </option>
            ))}
          </optgroup>
          <optgroup label="Crosses">
            {FOREX_PAIRS.filter((p) => p.category === 'CROSS').map((p) => (
              <option key={p.id} value={p.id}>
                {p.symbol}
              </option>
            ))}
          </optgroup>
          <optgroup label="Exotics">
            {FOREX_PAIRS.filter((p) => p.category === 'EXOTIC').map((p) => (
              <option key={p.id} value={p.id}>
                {p.symbol}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Spread Badge (Desktop) */}
        <div className="hidden lg:flex items-center h-6.5 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4]/80 dark:border-[#1F1F24] rounded-[4px] px-2 space-x-1 text-[11px] text-[#897E9C] dark:text-[#71717A]">
          <span>Spread</span>
          <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures">
            {spreadPips.toFixed(1)}p
          </span>
        </div>

        {/* Timeframe Selector: Desktop Buttons */}
        <div className="hidden md:flex items-center h-6.5 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4]/80 dark:border-[#1F1F24] rounded-[4px] p-0.5 space-x-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`h-5 px-1.5 text-[10px] sm:text-[11px] font-medium rounded-[3px] transition-colors cursor-pointer flex items-center justify-center ${
                timeframe === tf
                  ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                  : 'text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Timeframe Selector: Mobile Dropdown */}
        <div className="md:hidden">
          <select
            value={timeframe}
            onChange={(e) => onSelectTimeframe(e.target.value as Timeframe)}
            className="h-6.5 bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#7C3AED] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] px-1.5 py-0 text-[11px] font-bold focus:outline-none focus:border-[#7C3AED] cursor-pointer"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Market Sessions (Desktop) */}
      <div className="hidden xl:flex items-center space-x-1 text-xs">
        {SESSIONS.map((sess) => {
          const active = isSessionActive(sess.openHourUTC, sess.closeHourUTC);
          return (
            <div
              key={sess.code}
              className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium border ${
                active
                  ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#059669] dark:text-[#34D399]'
                  : 'border-transparent text-[#A297B6] dark:text-[#52525B]'
              }`}
            >
              {sess.name}
            </div>
          );
        })}
      </div>

      {/* Account Telemetry, Dark View Toggle & Controls */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs shrink-0">
        {/* Practice Progress Pill Button */}
        {onOpenProgressModal && (
          <button
            onClick={onOpenProgressModal}
            title="View Saved Practice Progress & Session History"
            className="h-6.5 border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#1A1325] dark:text-[#EDEDED] rounded-[4px] px-2 flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <History className="w-3 h-3 text-[#7C3AED] hidden xs:inline" />
            <span className="text-[10px] font-medium text-[#897E9C] dark:text-[#71717A] hidden sm:inline">Practice:</span>
            <span
              className={`text-[11px] font-bold tabular-figures ${
                netProfit !== 0
                  ? isProfitable
                    ? 'text-[#059669] dark:text-[#34D399]'
                    : 'text-[#F43F5E] dark:text-[#F87171]'
                  : 'text-[#1A1325] dark:text-[#EDEDED]'
              }`}
            >
              {netProfit !== 0 ? (isProfitable ? '+' : '') : ''}${netProfit.toFixed(0)}
            </span>
          </button>
        )}

        {/* Account Balances (Compact on Mobile, Expanded on Desktop) */}
        <div className="h-6.5 flex items-center space-x-2 sm:space-x-2.5 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4]/80 dark:border-[#1F1F24] rounded-[4px] px-2 sm:px-2.5 text-[11px]">
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Bal</span>
            <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E8DEF4] dark:bg-[#1F1F24]" />

          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Eq</span>
            <span
              className={`font-semibold tabular-figures ${
                account.equity >= account.balance ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E] dark:text-[#F87171]'
              }`}
            >
              ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E8DEF4] dark:bg-[#1F1F24] hidden md:block" />

          <div className="hidden md:flex items-center space-x-1">
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Margin</span>
            <span className="text-[#5B526D] dark:text-[#A1A1AA] font-semibold tabular-figures">
              ${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Dark View Icon Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light View' : 'Dark View (Full Black)'}
            className="h-6.5 border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[4px] px-2 text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
            aria-label="Toggle dark view"
          >
            {isDark ? (
              <Sun className="w-3 h-3 text-[#F59E0B]" />
            ) : (
              <Moon className="w-3 h-3 text-[#7C3AED]" />
            )}
            <span className="hidden xl:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        )}

        {/* Forex Factory News Button */}
        {onOpenNews && (
          <button
            onClick={onOpenNews}
            title="Forex Factory Economic Calendar & News"
            className="h-6.5 border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[4px] px-2 text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <Newspaper className="w-3 h-3 text-[#7C3AED]" />
            <span className="hidden sm:inline">FF News</span>
          </button>
        )}

        {/* Quick Start Guide Button */}
        <button
          onClick={onOpenGuide}
          title="Quick Start Guide & Shortcuts (?)"
          className="h-6.5 border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[4px] px-2 text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
        >
          <BookOpen className="w-3 h-3 text-[#7C3AED]" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Reset Replay Button */}
        <button
          onClick={onResetAccount}
          title="Reset Account & Replay"
          className="h-6.5 w-6.5 border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
