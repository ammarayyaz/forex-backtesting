import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Keyboard,
  ShieldCheck,
  UploadCloud,
  BarChart2,
  Play,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface QuickStartGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'WORKFLOW' | 'SHORTCUTS' | 'RISK_MATH' | 'CSV_IMPORT' | 'METRICS';

export const QuickStartGuide: React.FC<QuickStartGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('WORKFLOW');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('quantfx_hide_guide_on_start') === 'true';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCheckboxChange = (checked: boolean) => {
    setDontShowAgain(checked);
    localStorage.setItem('quantfx_hide_guide_on_start', checked ? 'true' : 'false');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1325]/40 dark:bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#000000] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col text-[#1A1325] dark:text-[#EDEDED] overflow-hidden transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 border-b border-[#E8DEF4] dark:border-[#1F1F24] px-3 sm:px-4 flex items-center justify-between bg-[#FAF7FD] dark:bg-[#050507]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-[4px] bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#1A1325] dark:text-[#EDEDED] tracking-tight uppercase">
                QuantFX User Guide
              </h2>
              <p className="text-[10px] text-[#897E9C] dark:text-[#71717A] hidden sm:block">
                Institutional Forex Backtesting, Bar-by-Bar Replay & Risk Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] p-1 rounded-[4px] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#050507] px-3 space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('WORKFLOW')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'WORKFLOW'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>4-Step Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('SHORTCUTS')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'SHORTCUTS'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Hotkeys & Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('RISK_MATH')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'RISK_MATH'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk Sizing & Margins</span>
          </button>

          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'METRICS'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('CSV_IMPORT')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'CSV_IMPORT'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Custom CSV Data</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 text-xs leading-relaxed space-y-4">
          {activeTab === 'WORKFLOW' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  QuantFX is a high-precision historical replay engine designed specifically for pure Forex pairs.
                  Follow these four steps to run realistic backtesting sessions without lookahead bias.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#7C3AED] font-bold text-xs uppercase">
                    <span className="w-4 h-4 rounded-[4px] bg-[#7C3AED]/10 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Select Pair & Timeframe</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Pick any of the 28 FX pairs (Majors, Crosses, Exotics) from the top bar. Choose your timeframe
                    from M1 up to D1. The engine aggregates authentic 1-minute historical candles instantly.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#7C3AED] font-bold text-xs uppercase">
                    <span className="w-4 h-4 rounded-[4px] bg-[#7C3AED]/10 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Replay Bar-By-Bar</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Use the bottom replay control bar to step forward one candle at a time (Right Arrow or Spacebar to
                    stream continuous replay). Inspect market structure bar-by-bar with zero future leakage.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#7C3AED] font-bold text-xs uppercase">
                    <span className="w-4 h-4 rounded-[4px] bg-[#7C3AED]/10 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Execute With Position Sizing</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Open the Trade Panel on the right. Select your desired Risk % (1%, 2%, 3%) and enter your Stop
                    Loss in pips. The terminal automatically computes exact lot sizes according to account balance.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#7C3AED] font-bold text-xs uppercase">
                    <span className="w-4 h-4 rounded-[4px] bg-[#7C3AED]/10 flex items-center justify-center text-[10px]">
                      4
                    </span>
                    <span>Audit Performance & Journal</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Review Win Rate %, Profit Factor, Max Drawdown, and Sharpe Ratio in the bottom Analytics Deck.
                    Export your full trade history as a clean CSV file anytime for deeper analysis.
                  </p>
                </div>
              </div>

              <div className="border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C]">
                <h3 className="font-bold text-[#1A1325] dark:text-[#EDEDED] text-xs mb-1">Authentic Execution Details</h3>
                <ul className="space-y-1 text-[#5B526D] dark:text-[#A1A1AA]">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#1A1325] dark:text-[#EDEDED]">Real Spreads:</strong> Buy orders enter at Ask, Sell orders enter at Bid. Spread pips are
                      displayed in real time in the top telemetry bar.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#1A1325] dark:text-[#EDEDED]">Automated SL/TP Triggers:</strong> As candles advance, if high or low reaches your price
                      target, the trade closes automatically at the limit price.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#1A1325] dark:text-[#EDEDED]">1-Click Breakeven:</strong> Shift Stop Loss to your exact entry price instantly once a
                      trade moves into profit to eliminate downside risk.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'SHORTCUTS' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  Accelerate your backtesting speed with standard keyboard hotkeys and chart navigation tools.
                </p>
              </div>

              <div className="border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] overflow-x-auto bg-white dark:bg-[#0A0A0C]">
                <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7FD] dark:bg-[#050507] border-b border-[#E8DEF4] dark:border-[#1F1F24] text-[#897E9C] dark:text-[#71717A] font-semibold">
                      <th className="py-2 px-3">Shortcut / Action</th>
                      <th className="py-2 px-3">Key / Gesture</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DEF4] dark:divide-[#1F1F24]">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Play / Pause Replay</td>
                      <td className="py-2 px-3">
                        <kbd className="px-2 py-0.5 bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] font-mono text-[11px] text-[#7C3AED]">
                          Space
                        </kbd>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">
                        Start or pause continuous automatic candle replay.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Step Next Bar</td>
                      <td className="py-2 px-3">
                        <kbd className="px-2 py-0.5 bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] font-mono text-[11px] text-[#7C3AED]">
                          Right Arrow →
                        </kbd>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">Advance the simulation by exactly 1 candle.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Step Back Bar</td>
                      <td className="py-2 px-3">
                        <kbd className="px-2 py-0.5 bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] font-mono text-[11px] text-[#7C3AED]">
                          Left Arrow ←
                        </kbd>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">Step back 1 candle into past history.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Open Guide / Help</td>
                      <td className="py-2 px-3">
                        <kbd className="px-2 py-0.5 bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] font-mono text-[11px] text-[#7C3AED]">
                          ?
                        </kbd>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">Toggle this reference and guide dialog.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Close Dialogs</td>
                      <td className="py-2 px-3">
                        <kbd className="px-2 py-0.5 bg-[#FAF7FD] dark:bg-[#141418] border border-[#E8DEF4] dark:border-[#27272A] rounded-[4px] font-mono text-[11px] text-[#7C3AED]">
                          Esc
                        </kbd>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">Close guide modal or dismiss active tooltips.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Inspect Bar Details</td>
                      <td className="py-2 px-3">
                        <span className="text-[#5B526D] dark:text-[#A1A1AA] font-mono text-[11px]">Click Any Candle</span>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">
                        Displays popup with precise open/close time, candle duration, and pip range.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#1A1325] dark:text-[#EDEDED]">Pan / Zoom Chart</td>
                      <td className="py-2 px-3">
                        <span className="text-[#5B526D] dark:text-[#A1A1AA] font-mono text-[11px]">Click & Drag / Scroll</span>
                      </td>
                      <td className="py-2 px-3 text-[#5B526D] dark:text-[#A1A1AA]">
                        Drag horizontally to pan. Scroll mouse wheel to zoom candles.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'RISK_MATH' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  QuantFX uses real institutional Forex mathematics for lot calculations, pip valuation, and margin
                  requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Risk % Lot Sizing Formula</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    When you specify a risk percentage (such as 1% or 2%) and a Stop Loss in pips, your lot size is
                    calculated dynamically:
                  </p>
                  <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] p-2 font-mono text-[11px] text-[#7C3AED]">
                    Risk Amount ($) = Balance × (Risk % / 100)
                    <br />
                    Lot Size = Risk Amount / (SL Pips × Pip Value per Lot)
                  </div>
                  <p className="text-[11px] text-[#897E9C] dark:text-[#71717A]">
                    For EUR/USD with a $10,000 balance and 20 pip SL at 1% risk:
                    <br />
                    Risk = $100. Lot Size = $100 / (20 × $10) = <strong className="text-[#1A1325] dark:text-[#EDEDED]">0.50 Lots</strong>.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <DollarSign className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                    <span>Required Margin & Leverage</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Margin is collateral held by the broker to keep positions open, based on 1:100 leverage:
                  </p>
                  <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] p-2 font-mono text-[11px] text-[#059669] dark:text-[#34D399]">
                    Notional Value = Lots × 100,000 units
                    <br />
                    Required Margin = (Notional × Entry Price) / 100
                  </div>
                  <p className="text-[11px] text-[#897E9C] dark:text-[#71717A]">
                    Free Margin = Equity − Used Margin. If free margin drops to zero, new positions cannot be opened.
                  </p>
                </div>
              </div>

              <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-2">
                <h4 className="font-bold text-[#1A1325] dark:text-[#EDEDED] text-xs">Standard Contract Specifications</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] bg-[#FAF7FD] dark:bg-[#050507]">
                    <span className="text-[#897E9C] dark:text-[#71717A] block text-[10px]">Standard Lot</span>
                    <strong className="text-[#1A1325] dark:text-[#EDEDED]">1.00 Lot</strong>
                    <span className="text-[#5B526D] dark:text-[#A1A1AA] block text-[10px]">100,000 units ($10/pip)</span>
                  </div>
                  <div className="p-2 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] bg-[#FAF7FD] dark:bg-[#050507]">
                    <span className="text-[#897E9C] dark:text-[#71717A] block text-[10px]">Mini Lot</span>
                    <strong className="text-[#1A1325] dark:text-[#EDEDED]">0.10 Lot</strong>
                    <span className="text-[#5B526D] dark:text-[#A1A1AA] block text-[10px]">10,000 units ($1/pip)</span>
                  </div>
                  <div className="p-2 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] bg-[#FAF7FD] dark:bg-[#050507]">
                    <span className="text-[#897E9C] dark:text-[#71717A] block text-[10px]">Micro Lot</span>
                    <strong className="text-[#1A1325] dark:text-[#EDEDED]">0.01 Lot</strong>
                    <span className="text-[#5B526D] dark:text-[#A1A1AA] block text-[10px]">1,000 units ($0.10/pip)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'METRICS' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  Real-time quantitative analytics update on every candle tick and closed position in the bottom
                  Analytics Deck.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Win Rate % & Profit Factor</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    <strong className="text-[#1A1325] dark:text-[#EDEDED]">Win Rate:</strong> (Winning Trades / Total Closed Trades) × 100%.
                    <br />
                    <strong className="text-[#1A1325] dark:text-[#EDEDED]">Profit Factor:</strong> Gross Profit divided by Gross Loss. A value above 1.5 indicates a
                    statistically robust trading edge.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <BarChart2 className="w-3.5 h-3.5 text-[#F43F5E]" />
                    <span>Max Drawdown (DD) %</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Measures the largest peak-to-trough decline in account balance during the testing session. Essential
                    for validating risk compliance for proprietary trading firm evaluations.
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <Sliders className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                    <span>Average Win / Loss Pips</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Average pips gained on winning trades versus average pips surrendered on losing trades. Provides
                    your actual empirical Risk-to-Reward ratio (R:R).
                  </p>
                </div>

                <div className="p-3 border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] bg-white dark:bg-[#0A0A0C] space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1325] dark:text-[#EDEDED]">
                    <DollarSign className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Expected Payoff</span>
                  </div>
                  <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                    Net total profit divided by total trades. Represents the mathematical expectancy in dollars gained
                    per execution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CSV_IMPORT' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  Import your own broker or external M1 historical data directly into the QuantFX engine. The platform
                  will automatically resample it across all timeframes (M1, M5, M15, M30, H1, H4, D1).
                </p>
              </div>

              <div className="border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-3 bg-white dark:bg-[#0A0A0C] space-y-2">
                <h4 className="font-bold text-[#1A1325] dark:text-[#EDEDED] text-xs">Supported CSV Format</h4>
                <p className="text-[#5B526D] dark:text-[#A1A1AA]">
                  Your CSV file must have column headers with standard names (case-insensitive). Compatible with
                  MetaTrader 4/5, TradingView, and standard FX brokers:
                </p>
                <div className="bg-[#FAF7FD] dark:bg-[#050507] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[4px] p-2.5 font-mono text-[11px] text-[#1A1325] dark:text-[#EDEDED] overflow-x-auto">
                  Date,Open,High,Low,Close,Volume
                  <br />
                  2026-03-01 00:00:00,1.08500,1.08540,1.08480,1.08520,120
                  <br />
                  2026-03-01 00:01:00,1.08520,1.08560,1.08510,1.08550,95
                </div>
              </div>

              <div className="border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] space-y-2">
                <h4 className="font-bold text-[#1A1325] dark:text-[#EDEDED] text-xs">How to Import</h4>
                <ol className="list-decimal list-inside space-y-1 text-[#5B526D] dark:text-[#A1A1AA]">
                  <li>Open the bottom Analytics Deck and click on the <strong className="text-[#1A1325] dark:text-[#EDEDED]">DATA</strong> tab.</li>
                  <li>Click <strong className="text-[#1A1325] dark:text-[#EDEDED]">Choose CSV File</strong> or drag and drop your exported file.</li>
                  <li>The engine instantly parses, validates, and initializes the replay timeline with your custom data.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-[#E8DEF4] dark:border-[#1F1F24] px-4 flex items-center justify-between bg-[#FAF7FD] dark:bg-[#050507]">
          <label className="flex items-center space-x-2 text-xs text-[#5B526D] dark:text-[#A1A1AA] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              className="rounded-[3px] border-[#E8DEF4] dark:border-[#27272A] text-[#7C3AED] focus:ring-0 cursor-pointer"
            />
            <span>Do not open automatically on startup</span>
          </label>

          <button
            onClick={onClose}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
