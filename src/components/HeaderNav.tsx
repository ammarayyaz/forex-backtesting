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
    <header className="h-11 bg-white dark:bg-[#000000] border-b border-[#E8DEF4] dark:border-[#1F1F24] px-2 sm:px-3 flex items-center justify-between select-none text-[#1A1325] dark:text-[#EDEDED] touch-manipulation transition-colors duration-150">
      {/* Brand & Pair Selector */}
      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
        <div className="flex items-center space-x-1 font-bold tracking-tight text-xs sm:text-sm text-[#1A1325] dark:text-[#EDEDED]">
          <span className="text-[#7C3AED]">QuantFX</span>
        </div>

        <div className="h-4 w-[1px] bg-[#E8DEF4] dark:bg-[#1F1F24]" />

        {/* Currency Pair Dropdown */}
        <select
          value={currentPair.id}
          onChange={(e) => {
            const pair = FOREX_PAIRS.find((p) => p.id === e.target.value);
            if (pair) onSelectPair(pair);
          }}
          className="bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#1A1325] dark:text-[#EDEDED] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-1.5 sm:px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#7C3AED] cursor-pointer max-w-[95px] xs:max-w-[110px] sm:max-w-none transition-colors"
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
        <div className="hidden lg:flex items-center bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] px-2 py-0.5 space-x-1 text-xs text-[#897E9C] dark:text-[#71717A]">
          <span>Spread</span>
          <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures">
            {spreadPips.toFixed(1)}p
          </span>
        </div>

        {/* Timeframe Selector: Desktop Buttons */}
        <div className="hidden md:flex items-center bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-0.5 space-x-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#7C3AED] text-white shadow-xs'
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
            className="bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#7C3AED] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-1.5 py-1 text-xs font-bold focus:outline-none focus:border-[#7C3AED] cursor-pointer"
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
              className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
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
            className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#1A1325] dark:text-[#EDEDED] rounded-[6px] px-2 py-1 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <History className="w-3.5 h-3.5 text-[#7C3AED] hidden xs:inline" />
            <span className="text-[11px] font-semibold hidden sm:inline">Practice:</span>
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
        <div className="flex items-center space-x-1.5 sm:space-x-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] px-2 sm:px-2.5 py-1">
          <div className="flex flex-col text-right leading-none">
            <span className="text-[9px] sm:text-[10px] text-[#897E9C] dark:text-[#71717A]">Bal</span>
            <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures text-[11px] sm:text-xs">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="w-[1px] h-5 bg-[#E8DEF4] dark:bg-[#1F1F24]" />

          <div className="flex flex-col text-right leading-none">
            <span className="text-[9px] sm:text-[10px] text-[#897E9C] dark:text-[#71717A]">Eq</span>
            <span
              className={`font-semibold tabular-figures text-[11px] sm:text-xs ${
                account.equity >= account.balance ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E] dark:text-[#F87171]'
              }`}
            >
              ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="w-[1px] h-5 bg-[#E8DEF4] dark:bg-[#1F1F24] hidden md:block" />

          <div className="hidden md:flex flex-col text-right leading-none">
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Free Margin</span>
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
            className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[6px] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            aria-label="Toggle dark view"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />
            )}
            <span className="hidden lg:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        )}

        {/* Forex Factory News Button */}
        {onOpenNews && (
          <button
            onClick={onOpenNews}
            title="Forex Factory Economic Calendar & News"
            className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[6px] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Newspaper className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="hidden sm:inline">FF News</span>
          </button>
        )}

        {/* Quick Start Guide Button */}
        <button
          onClick={onOpenGuide}
          title="Quick Start Guide & Shortcuts (?)"
          className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[6px] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Reset Replay Button */}
        <button
          onClick={onResetAccount}
          title="Reset Account & Replay"
          className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[6px] p-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
