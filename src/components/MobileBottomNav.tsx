import React from 'react';
import { LineChart, Layers, History, Award } from 'lucide-react';
import type { AccountState, Position } from '../types/forex';

interface MobileBottomNavProps {
  isOrderConsoleOpen: boolean;
  onToggleOrderConsole: () => void;
  isBottomDeckOpen: boolean;
  onToggleBottomDeck: () => void;
  onOpenProgressModal: () => void;
  positions: Position[];
  closedTradesCount: number;
  account: AccountState;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isOrderConsoleOpen,
  onToggleOrderConsole,
  isBottomDeckOpen,
  onToggleBottomDeck,
  onOpenProgressModal,
  positions,
  closedTradesCount,
  account,
}) => {
  const netProfit = account.balance - account.initialBalance;
  const isProfitable = netProfit >= 0;

  const isChartActive = !isOrderConsoleOpen && !isBottomDeckOpen;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-t border-[#E8DEF4] dark:border-[#1F1F24] h-12 flex items-center justify-around px-1 select-none shadow-sm touch-manipulation transition-colors duration-150">
      {/* 1. Chart View Tab */}
      <button
        onClick={() => {
          if (isOrderConsoleOpen) onToggleOrderConsole();
          if (isBottomDeckOpen) onToggleBottomDeck();
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer active:scale-95 ${
          isChartActive
            ? 'text-[#7C3AED] font-bold'
            : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
        }`}
      >
        <LineChart className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] leading-tight">Chart</span>
      </button>

      {/* 2. Trade Console Tab */}
      <button
        onClick={onToggleOrderConsole}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer active:scale-95 ${
          isOrderConsoleOpen
            ? 'text-[#7C3AED] font-bold'
            : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
        }`}
      >
        <div className="relative">
          <Layers className="w-4 h-4 mb-0.5" />
          {positions.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#7C3AED] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {positions.length}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-tight">Trade</span>
      </button>

      {/* 3. Analytics & Trade History Deck Tab */}
      <button
        onClick={onToggleBottomDeck}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer active:scale-95 ${
          isBottomDeckOpen
            ? 'text-[#7C3AED] font-bold'
            : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
        }`}
      >
        <div className="relative">
          <History className="w-4 h-4 mb-0.5" />
          {closedTradesCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#27272A] text-[#1A1325] dark:text-[#EDEDED] text-[9px] font-bold px-1 rounded-full flex items-center justify-center">
              {closedTradesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-tight">Log & Deck</span>
      </button>

      {/* 4. Practice Progress Tracker Tab */}
      <button
        onClick={onOpenProgressModal}
        className="flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer active:scale-95 text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]"
      >
        <div className="flex items-center space-x-0.5">
          <Award className="w-4 h-4 mb-0.5 text-[#7C3AED]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        </div>
        <span
          className={`text-[10px] font-bold leading-tight ${
            netProfit !== 0
              ? isProfitable
                ? 'text-[#059669] dark:text-[#34D399]'
                : 'text-[#F43F5E] dark:text-[#F87171]'
              : 'text-[#897E9C] dark:text-[#71717A]'
          }`}
        >
          {netProfit !== 0 ? (isProfitable ? '+' : '') + `$${netProfit.toFixed(0)}` : 'Progress'}
        </span>
      </button>
    </nav>
  );
};
