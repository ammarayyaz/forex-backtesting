import React, { useState } from 'react';
import type { ForexPair, Position, AccountState, OrderType, OrderSetupPreview } from '../types/forex';
import { ForexMath } from '../services/forexMath';
import { Shield, Target, ArrowUpRight, ArrowDownRight, X, ArrowLeft, Plus, Minus, MoveVertical } from 'lucide-react';

interface OrderConsoleProps {
  pair: ForexPair;
  currentBid: number;
  currentAsk: number;
  account: AccountState;
  positions: Position[];
  onOpenOrder: (type: OrderType, lotSize: number, slPips?: number, tpPips?: number) => void;
  onClosePosition: (id: string) => void;
  onSetBreakeven: (id: string) => void;
  onCloseAll: () => void;
  onClose?: () => void;
  orderSetup?: OrderSetupPreview;
  onUpdateOrderSetup?: (setup: Partial<OrderSetupPreview>) => void;
}

export const OrderConsole: React.FC<OrderConsoleProps> = ({
  pair,
  currentBid,
  currentAsk,
  account,
  positions,
  onOpenOrder,
  onClosePosition,
  onSetBreakeven,
  onCloseAll,
  onClose,
  orderSetup,
  onUpdateOrderSetup,
}) => {
  const [localLotSize, setLocalLotSize] = useState<number>(1.0);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [localSlPips, setLocalSlPips] = useState<number>(20.0);
  const [localTpPips, setLocalTpPips] = useState<number>(40.0);
  const [isRiskAutoSizing, setIsRiskAutoSizing] = useState<boolean>(true);

  // Directly derive values from orderSetup if available, avoiding setState in effects
  const slPips = orderSetup?.slPips ?? localSlPips;
  const tpPips = orderSetup?.tpPips ?? localTpPips;
  const lotSize = orderSetup?.lotSize ?? localLotSize;

  const handleSlChange = (val: number) => {
    const clean = Math.max(1, val);
    setLocalSlPips(clean);
    onUpdateOrderSetup?.({ slPips: clean });
  };

  const handleTpChange = (val: number) => {
    const clean = Math.max(1, val);
    setLocalTpPips(clean);
    onUpdateOrderSetup?.({ tpPips: clean });
  };

  const handleLotChange = (val: number) => {
    const clean = Math.max(0.01, val);
    setLocalLotSize(clean);
    onUpdateOrderSetup?.({ lotSize: clean });
  };

  const calculatedLots = isRiskAutoSizing
    ? ForexMath.calculateLotSize(
        pair,
        account.equity * (riskPercent / 100),
        slPips,
        currentAsk
      )
    : lotSize;

  const effectiveLots = isRiskAutoSizing ? calculatedLots : lotSize;

  const pipValue = ForexMath.getPipValuePerStandardLot(pair, currentAsk) * effectiveLots;
  const dollarRisk = slPips * pipValue;
  const dollarReward = tpPips * pipValue;
  const riskRewardRatio = slPips > 0 ? (tpPips / slPips).toFixed(2) : '0.00';
  const marginRequired = ForexMath.calculateRequiredMargin(pair, effectiveLots, currentAsk, account.leverage);

  const activePairPositions = positions.filter((p) => p.pairId === pair.id);

  const quickLots = [0.01, 0.05, 0.1, 0.5, 1.0, 2.0];
  const quickSlPresets = [10, 15, 20, 30, 50];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 md:w-80 md:relative md:inset-auto md:z-auto bg-white dark:bg-[#000000] border-l border-[#E8DEF4] dark:border-[#1F1F24] shadow-2xl md:shadow-none flex flex-col h-full select-none text-xs text-[#1A1325] dark:text-[#EDEDED] overflow-y-auto animate-in slide-in-from-right duration-150 touch-manipulation transition-colors duration-150">
      {/* Console Header */}
      <div className="p-3 border-b border-[#E8DEF4] dark:border-[#1F1F24] flex items-center justify-between bg-[#FAF7FD] dark:bg-[#000000]">
        <div className="flex items-center space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              title="Back to Chart"
              className="md:hidden text-[#7C3AED] hover:text-[#6D28D9] p-1 -ml-1 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer flex items-center space-x-1 font-semibold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chart</span>
            </button>
          )}
          <span className="font-semibold text-sm text-[#1A1325] dark:text-[#EDEDED]">Order Execution</span>
          <div className="text-[11px] bg-[#F3EEF9] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] px-1.5 py-0.5 text-[#7C3AED] font-medium">
            1:{account.leverage}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title="Close Order Panel"
            className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-1 rounded hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-3 flex-1">
        {/* Instant Buy / Sell Dual Deck */}
        <div className="grid grid-cols-2 gap-2">
          {/* Sell Market Button */}
          <button
            onClick={() => {
              onUpdateOrderSetup?.({ type: 'SELL' });
              onOpenOrder('SELL', effectiveLots, slPips, tpPips);
            }}
            onMouseEnter={() => onUpdateOrderSetup?.({ type: 'SELL' })}
            className={`border rounded-[6px] p-2.5 sm:p-2.5 flex flex-col text-left transition-colors cursor-pointer group active:scale-[0.98] ${
              orderSetup?.type === 'SELL'
                ? 'border-[#F43F5E] bg-[#F43F5E]/15 dark:bg-[#F43F5E]/20 shadow-xs'
                : 'border-[#F43F5E]/30 bg-[#F43F5E]/5 dark:bg-[#F43F5E]/10 hover:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20'
            }`}
          >
            <div className="flex items-center justify-between text-[#F43F5E] font-semibold text-xs mb-1">
              <span>Sell Market</span>
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[#1A1325] dark:text-[#EDEDED] text-lg sm:text-base font-bold tabular-figures">
              {ForexMath.formatPrice(currentBid, pair.decimals)}
            </span>
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] mt-0.5">Bid Price</span>
          </button>

          {/* Buy Market Button */}
          <button
            onClick={() => {
              onUpdateOrderSetup?.({ type: 'BUY' });
              onOpenOrder('BUY', effectiveLots, slPips, tpPips);
            }}
            onMouseEnter={() => onUpdateOrderSetup?.({ type: 'BUY' })}
            className={`border rounded-[6px] p-2.5 sm:p-2.5 flex flex-col text-left transition-colors cursor-pointer group active:scale-[0.98] ${
              orderSetup?.type === 'BUY'
                ? 'border-[#10B981] bg-[#10B981]/15 dark:bg-[#10B981]/20 shadow-xs'
                : 'border-[#10B981]/30 bg-[#10B981]/5 dark:bg-[#10B981]/10 hover:bg-[#10B981]/10 dark:hover:bg-[#10B981]/20'
            }`}
          >
            <div className="flex items-center justify-between text-[#059669] font-semibold text-xs mb-1">
              <span>Buy Market</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[#1A1325] dark:text-[#EDEDED] text-lg sm:text-base font-bold tabular-figures">
              {ForexMath.formatPrice(currentAsk, pair.decimals)}
            </span>
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A] mt-0.5">Ask Price</span>
          </button>
        </div>

        {/* Chart Drag & Drop Visual Hint */}
        <div className="px-2.5 py-1.5 bg-[#7C3AED]/5 dark:bg-[#7C3AED]/15 border border-[#7C3AED]/20 dark:border-[#7C3AED]/30 rounded-[6px] flex items-center space-x-2 text-[11px] text-[#7C3AED]">
          <MoveVertical className="w-3.5 h-3.5 shrink-0 text-[#7C3AED]" />
          <span>Drag red SL & green TP handles directly on the chart to adjust.</span>
        </div>

        {/* Position Sizing Card */}
        <div className="ai-card p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1A1325] dark:text-[#EDEDED]">Position Sizing</span>
            <button
              onClick={() => setIsRiskAutoSizing(!isRiskAutoSizing)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border transition-colors cursor-pointer ${
                isRiskAutoSizing
                  ? 'border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#7C3AED]'
                  : 'border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] text-[#897E9C] dark:text-[#71717A]'
              }`}
            >
              {isRiskAutoSizing ? 'Auto Risk %' : 'Manual Lots'}
            </button>
          </div>

          {isRiskAutoSizing ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#897E9C] dark:text-[#71717A]">Account Risk %</span>
                <span className="text-[#7C3AED] font-bold">
                  {riskPercent}% (${((account.equity * riskPercent) / 100).toFixed(2)})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setRiskPercent(pct)}
                    className={`py-1.5 sm:py-1 text-xs font-medium rounded-[4px] border transition-colors cursor-pointer ${
                      riskPercent === pct
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                        : 'border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] text-[#5B526D] dark:text-[#EDEDED] hover:text-[#1A1325] dark:hover:text-white hover:bg-[#F3EEF9] dark:hover:bg-[#1F1F24]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-[#897E9C] dark:text-[#71717A]">Standard Lots</label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleLotChange(Math.max(0.01, Number((lotSize - 0.1).toFixed(2))))}
                    className="p-1 rounded bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] text-[#5B526D] dark:text-[#EDEDED] hover:text-[#1A1325] dark:hover:text-white cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLotChange(Number((lotSize + 0.1).toFixed(2)))}
                    className="p-1 rounded bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] text-[#5B526D] dark:text-[#EDEDED] hover:text-[#1A1325] dark:hover:text-white cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={lotSize}
                onChange={(e) => handleLotChange(parseFloat(e.target.value) || 0.01)}
                className="w-full bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] px-2.5 py-1.5 text-[#1A1325] dark:text-[#EDEDED] font-semibold text-base sm:text-xs focus:outline-none focus:border-[#7C3AED]"
              />
              <div className="grid grid-cols-6 gap-1 pt-1">
                {quickLots.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleLotChange(q)}
                    className={`py-1 text-[10px] font-semibold rounded-[4px] border transition-colors cursor-pointer ${
                      lotSize === q
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] text-[#5B526D] dark:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#1F1F24]'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizing Telemetry Box */}
          <div className="border border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] rounded-[6px] p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#897E9C] dark:text-[#71717A]">Calculated Lots</span>
              <span className="text-[#1A1325] dark:text-[#EDEDED] font-bold tabular-figures">{effectiveLots.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#897E9C] dark:text-[#71717A]">Margin Required</span>
              <span className="text-[#5B526D] dark:text-[#A1A1AA] tabular-figures">${marginRequired.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#897E9C] dark:text-[#71717A]">Pip Value</span>
              <span className="text-[#5B526D] dark:text-[#A1A1AA] tabular-figures">${pipValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Stop Loss & Take Profit Card */}
        <div className="ai-card p-3 space-y-2.5">
          <span className="text-xs font-semibold text-[#1A1325] dark:text-[#EDEDED]">Risk & Reward (Pips)</span>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F43F5E] font-semibold flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>SL (Pips)</span>
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                value={slPips}
                onChange={(e) => handleSlChange(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] px-2 py-1.5 text-[#1A1325] dark:text-[#EDEDED] font-semibold text-base sm:text-xs focus:outline-none focus:border-[#F43F5E]"
              />
              <span className="text-[11px] text-[#F43F5E] block text-right font-medium">
                -${dollarRisk.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#059669] font-semibold flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>TP (Pips)</span>
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                value={tpPips}
                onChange={(e) => handleTpChange(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] px-2 py-1.5 text-[#1A1325] dark:text-[#EDEDED] font-semibold text-base sm:text-xs focus:outline-none focus:border-[#10B981]"
              />
              <span className="text-[11px] text-[#059669] block text-right font-medium">
                +${dollarReward.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 pt-0.5">
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Quick SL:</span>
            {quickSlPresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  handleSlChange(p);
                  handleTpChange(p * 2);
                }}
                className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                  slPips === p
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] font-semibold'
                    : 'border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] text-[#5B526D] dark:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#1F1F24]'
                }`}
              >
                {p}p
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs border-t border-[#E8DEF4] dark:border-[#1F1F24] pt-2 text-[#897E9C] dark:text-[#71717A]">
            <span>Risk : Reward Ratio</span>
            <span className="text-[#1A1325] dark:text-[#EDEDED] font-bold">1 : {riskRewardRatio}</span>
          </div>
        </div>

        {/* Live Active Positions */}
        {activePairPositions.length > 0 && (
          <div className="ai-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1325] dark:text-[#EDEDED]">
                Open Positions ({activePairPositions.length})
              </span>
              <button
                onClick={onCloseAll}
                className="text-[11px] text-[#F43F5E] hover:underline font-medium cursor-pointer"
              >
                Close All
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activePairPositions.map((pos) => {
                const isProfitable = pos.unrealizedPnL >= 0;
                return (
                  <div
                    key={pos.id}
                    className="border border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#141418] rounded-[6px] p-2 space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span
                        className={`font-bold ${
                          pos.type === 'BUY' ? 'text-[#059669]' : 'text-[#F43F5E]'
                        }`}
                      >
                        {pos.type} {pos.lotSize}L
                      </span>
                      <span
                        className={`font-bold tabular-figures ${
                          isProfitable ? 'text-[#059669]' : 'text-[#F43F5E]'
                        }`}
                      >
                        {isProfitable ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({pos.pips.toFixed(1)}p)
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#897E9C] dark:text-[#71717A]">
                      <span>Entry: {ForexMath.formatPrice(pos.entryPrice, pair.decimals)}</span>
                      <span>Now: {ForexMath.formatPrice(pos.currentPrice, pair.decimals)}</span>
                    </div>

                    {/* SL & TP values with indicator */}
                    <div className="flex justify-between text-[10px] text-[#5B526D] dark:text-[#A1A1AA]">
                      <span>
                        SL: {pos.stopLoss ? ForexMath.formatPrice(pos.stopLoss, pair.decimals) : 'None'}
                      </span>
                      <span>
                        TP: {pos.takeProfit ? ForexMath.formatPrice(pos.takeProfit, pair.decimals) : 'None'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end space-x-1.5 pt-1">
                      <button
                        onClick={() => onSetBreakeven(pos.id)}
                        className="border border-[#E8DEF4] dark:border-[#1F1F24] bg-white dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#1F1F24] text-[11px] text-[#5B526D] dark:text-[#EDEDED] px-2 py-1 rounded-[4px] transition-colors cursor-pointer"
                      >
                        Breakeven
                      </button>
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="border border-[#F43F5E]/30 bg-white dark:bg-[#0A0A0C] hover:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 text-[11px] text-[#F43F5E] px-2 py-1 rounded-[4px] transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
