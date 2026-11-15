import React, { useState } from 'react';
import type { ClosedTrade, Position, PerformanceMetrics, ForexPair } from '../types/forex';
import { Download, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react';
import { ForexMath } from '../services/forexMath';

interface AnalyticsDeckProps {
  pair: ForexPair;
  positions: Position[];
  closedTrades: ClosedTrade[];
  metrics: PerformanceMetrics;
  onClosePosition: (id: string) => void;
  onImportCSV: (csvText: string) => void;
  totalBars: number;
  timeframe: string;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const AnalyticsDeck: React.FC<AnalyticsDeckProps> = ({
  pair,
  positions,
  closedTrades,
  metrics,
  onClosePosition,
  onImportCSV,
  totalBars,
  timeframe,
  isOpen = false,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY' | 'METRICS' | 'DATA'>('HISTORY');

  const exportCSV = () => {
    if (closedTrades.length === 0) return;
    const headers = 'ID,Pair,Type,Lots,OpenTime,CloseTime,EntryPrice,ExitPrice,Pips,PnL,Reason\n';
    const rows = closedTrades
      .map(
        (t) =>
          `${t.id},${t.pairId},${t.type},${t.lotSize},${t.openTime},${t.closeTime},${t.entryPrice},${t.exitPrice},${t.pips},${t.realizedPnL},${t.exitReason}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QuantFX_Trades_${pair.id}_${Date.now()}.csv`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onImportCSV(text);
    };
    reader.readAsText(file);
  };

  // If collapsed/closed: Render slender 28px bottom dock
  if (!isOpen) {
    return (
      <div className="h-7 bg-white dark:bg-[#000000] border-t border-[#E8DEF4] dark:border-[#1F1F24] px-2 sm:px-3 flex items-center justify-between text-xs text-[#5B526D] dark:text-[#A1A1AA] select-none touch-manipulation transition-colors duration-150">
        <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-[11px] truncate">
          <span>Pos: <strong className="text-[#1A1325] dark:text-[#EDEDED]">{positions.length}</strong></span>
          <span className="text-[#E8DEF4] dark:text-[#1F1F24]">|</span>
          <span>Trades: <strong className="text-[#1A1325] dark:text-[#EDEDED]">{closedTrades.length}</strong></span>
          <span className="text-[#E8DEF4] dark:text-[#1F1F24]">|</span>
          <span>Win: <strong className="text-[#059669] dark:text-[#34D399]">{metrics.winRate.toFixed(1)}%</strong></span>
        </div>

        <button
          onClick={onToggleOpen}
          className="flex items-center space-x-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:hover:text-[#9333EA] transition-colors py-0.5 px-2 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] cursor-pointer shrink-0"
        >
          <span>Panel</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-56 bg-white dark:bg-[#000000] border-t border-[#E8DEF4] dark:border-[#1F1F24] flex flex-col select-none text-[#1A1325] dark:text-[#EDEDED] touch-manipulation animate-in slide-in-from-bottom duration-150 transition-colors duration-150">
      {/* Clean Tab Navigation Header */}
      <div className="h-10 sm:h-9 px-2 sm:px-3 border-b border-[#E8DEF4] dark:border-[#1F1F24] flex items-center justify-between text-xs gap-2 bg-[#FAF7FD] dark:bg-[#050507]">
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'POSITIONS'
                ? 'bg-white dark:bg-[#0A0A0C] text-[#7C3AED] dark:text-[#A78BFA] font-semibold border border-[#E8DEF4] dark:border-[#27272A] shadow-xs'
                : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#141418]'
            }`}
          >
            <span className="sm:hidden">Pos ({positions.length})</span>
            <span className="hidden sm:inline">Positions ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-[#0A0A0C] text-[#7C3AED] dark:text-[#A78BFA] font-semibold border border-[#E8DEF4] dark:border-[#27272A] shadow-xs'
                : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#141418]'
            }`}
          >
            <span className="sm:hidden">History ({closedTrades.length})</span>
            <span className="hidden sm:inline">Trade History ({closedTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'METRICS'
                ? 'bg-white dark:bg-[#0A0A0C] text-[#7C3AED] dark:text-[#A78BFA] font-semibold border border-[#E8DEF4] dark:border-[#27272A] shadow-xs'
                : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#141418]'
            }`}
          >
            <span className="sm:hidden">Stats</span>
            <span className="hidden sm:inline">Statistics</span>
          </button>

          <button
            onClick={() => setActiveTab('DATA')}
            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'DATA'
                ? 'bg-white dark:bg-[#0A0A0C] text-[#7C3AED] dark:text-[#A78BFA] font-semibold border border-[#E8DEF4] dark:border-[#27272A] shadow-xs'
                : 'text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#141418]'
            }`}
          >
            <span className="sm:hidden">Data</span>
            <span className="hidden sm:inline">Data Engine</span>
          </button>
        </div>

        {/* Right Action Tools: Export CSV & Close / Collapse Button */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {activeTab === 'HISTORY' && closedTrades.length > 0 && (
            <button
              onClick={exportCSV}
              className="border border-[#E8DEF4] dark:border-[#27272A] bg-white dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#7C3AED] dark:hover:text-[#7C3AED] rounded-[4px] px-2 sm:px-2.5 py-1 text-xs font-medium flex items-center space-x-1 sm:space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {/* Option to Close this bar */}
          <button
            onClick={onToggleOpen}
            title="Close / Minimize Panel"
            className="flex items-center space-x-1 text-xs text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-1.5 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Close</span>
            <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-2 sm:p-2.5 overflow-y-auto">
        {/* POSITIONS TAB */}
        {activeTab === 'POSITIONS' && (
          <div className="w-full h-full overflow-x-auto">
            {positions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#897E9C] dark:text-[#71717A] py-4">
                No open positions
              </div>
            ) : (
              <table className="w-full min-w-[550px] text-left text-xs tabular-figures">
                <thead>
                  <tr className="text-[#897E9C] dark:text-[#71717A] border-b border-[#E8DEF4] dark:border-[#1F1F24] pb-1.5 font-medium">
                    <th className="py-1">Pair</th>
                    <th>Type</th>
                    <th>Lots</th>
                    <th>Entry</th>
                    <th>Current</th>
                    <th>SL</th>
                    <th>TP</th>
                    <th>Pips</th>
                    <th>Unrealized P&L</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFFB] dark:divide-[#141418]">
                  {positions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-[#FAF7FD] dark:hover:bg-[#0A0A0C]">
                        <td className="py-1.5 font-semibold text-[#1A1325] dark:text-[#EDEDED]">{pos.pairId}</td>
                        <td className={`font-semibold ${pos.type === 'BUY' ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {pos.type}
                        </td>
                        <td className="text-[#1A1325] dark:text-[#EDEDED]">{pos.lotSize}</td>
                        <td className="text-[#5B526D] dark:text-[#A1A1AA]">{pos.entryPrice}</td>
                        <td className="text-[#1A1325] dark:text-[#EDEDED] font-semibold">{pos.currentPrice}</td>
                        <td className="text-[#F43F5E]">{pos.stopLoss || '—'}</td>
                        <td className="text-[#059669] dark:text-[#34D399]">{pos.takeProfit || '—'}</td>
                        <td className={`font-medium ${isProfit ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {pos.pips >= 0 ? '+' : ''}{pos.pips.toFixed(1)}p
                        </td>
                        <td className={`font-semibold ${isProfit ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => onClosePosition(pos.id)}
                            className="border border-[#F43F5E]/30 bg-white dark:bg-[#0A0A0C] hover:bg-[#F43F5E]/10 text-xs text-[#F43F5E] px-2 py-0.5 rounded-[4px] font-medium cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TRADE HISTORY TAB (Formatted with Pakistani AM/PM time) */}
        {activeTab === 'HISTORY' && (
          <div className="w-full h-full overflow-x-auto">
            {closedTrades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#897E9C] dark:text-[#71717A] py-4">
                No closed trades yet in this practice session
              </div>
            ) : (
              <table className="w-full min-w-[620px] text-left text-xs tabular-figures">
                <thead>
                  <tr className="text-[#897E9C] dark:text-[#71717A] border-b border-[#E8DEF4] dark:border-[#1F1F24] pb-1.5 font-medium">
                    <th className="py-1">Exit Time (PKT)</th>
                    <th>Pair</th>
                    <th>Type</th>
                    <th>Lots</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Pips</th>
                    <th>Profit</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFFB] dark:divide-[#141418]">
                  {closedTrades.slice().reverse().map((trade) => {
                    const isProfit = trade.realizedPnL >= 0;
                    const dateStr = ForexMath.formatPakistaniTime(trade.closeTime, false);
                    return (
                      <tr key={trade.id} className="hover:bg-[#FAF7FD] dark:hover:bg-[#0A0A0C]">
                        <td className="py-1.5 text-[#5B526D] dark:text-[#71717A]">{dateStr}</td>
                        <td className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{trade.pairId}</td>
                        <td className={`font-semibold ${trade.type === 'BUY' ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {trade.type}
                        </td>
                        <td className="text-[#1A1325] dark:text-[#EDEDED]">{trade.lotSize}</td>
                        <td className="text-[#5B526D] dark:text-[#A1A1AA]">{trade.entryPrice}</td>
                        <td className="text-[#1A1325] dark:text-[#EDEDED]">{trade.exitPrice}</td>
                        <td className={`font-medium ${isProfit ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {trade.pips >= 0 ? '+' : ''}{trade.pips.toFixed(1)}p
                        </td>
                        <td className={`font-semibold ${isProfit ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'}`}>
                          {isProfit ? '+' : ''}${trade.realizedPnL.toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-[4px] border font-medium ${
                              trade.exitReason === 'TAKE_PROFIT'
                                ? 'border-[#10B981]/30 text-[#059669] dark:text-[#34D399] bg-[#10B981]/10'
                                : trade.exitReason === 'STOP_LOSS'
                                ? 'border-[#F43F5E]/30 text-[#F43F5E] dark:text-[#F87171] bg-[#F43F5E]/10'
                                : 'border-[#E8DEF4] dark:border-[#27272A] text-[#5B526D] dark:text-[#A1A1AA] bg-[#FAF7FD] dark:bg-[#0A0A0C]'
                            }`}
                          >
                            {trade.exitReason === 'TAKE_PROFIT'
                              ? 'Take Profit'
                              : trade.exitReason === 'STOP_LOSS'
                              ? 'Stop Loss'
                              : 'Manual'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'METRICS' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Total Trades</span>
              <span className="text-[#1A1325] dark:text-[#EDEDED] text-lg font-bold tabular-figures">{metrics.totalTrades}</span>
            </div>

            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Win Rate</span>
              <span className="text-[#059669] dark:text-[#34D399] text-lg font-bold tabular-figures">
                {metrics.winRate.toFixed(1)}%
              </span>
            </div>

            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Profit Factor</span>
              <span className="text-[#7C3AED] text-lg font-bold tabular-figures">
                {metrics.profitFactor === 99 ? 'Max' : metrics.profitFactor.toFixed(2)}
              </span>
            </div>

            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Net Profit</span>
              <span
                className={`text-lg font-bold tabular-figures ${
                  metrics.netProfit >= 0 ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#F43F5E]'
                }`}
              >
                {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(2)}
              </span>
            </div>

            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Max Drawdown</span>
              <span className="text-[#F43F5E] text-lg font-bold tabular-figures">
                {metrics.maxDrawdownPercent.toFixed(1)}%
              </span>
            </div>

            <div className="ai-card p-2.5">
              <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block">Sharpe Ratio</span>
              <span className="text-[#1A1325] dark:text-[#EDEDED] text-lg font-bold tabular-figures">
                {metrics.sharpeRatio.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* HISTORICAL ENGINE TAB */}
        {activeTab === 'DATA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="ai-card p-3 space-y-2">
              <span className="text-[#1A1325] dark:text-[#EDEDED] font-semibold block">Market Data Feed</span>
              <div className="space-y-1.5 text-[#5B526D] dark:text-[#A1A1AA]">
                <div className="flex justify-between">
                  <span>Pair</span>
                  <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{pair.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Candle Timeframe</span>
                  <span className="font-semibold text-[#7C3AED]">{timeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loaded Bars</span>
                  <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED] tabular-figures">{totalBars}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trading Schedule</span>
                  <span className="text-[#1A1325] dark:text-[#EDEDED]">24/5 New York 5:00 PM Close</span>
                </div>
              </div>
            </div>

            <div className="ai-card p-3 flex flex-col justify-between">
              <div>
                <span className="text-[#1A1325] dark:text-[#EDEDED] font-semibold block mb-0.5">Custom Broker Data</span>
                <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] block mb-2">
                  Import your own CSV data from MetaTrader or TradingView.
                </span>
              </div>

              <label className="border border-dashed border-[#BCAED9] dark:border-[#27272A] hover:border-[#7C3AED] bg-[#FAF7FD] dark:bg-[#000000] rounded-[6px] p-2 flex items-center justify-center space-x-2 cursor-pointer transition-colors text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]">
                <UploadCloud className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs font-semibold">Choose CSV File</span>
                <input
                  type="file"
                  accept=".csv,.txt,.hst"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
