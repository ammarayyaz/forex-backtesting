import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { ForexMath } from '../services/forexMath';

interface ReplayControlDeckProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onResetReplay: () => void;
  currentIndex: number;
  totalCandles: number;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  currentTimestamp: number;
}

export const ReplayControlDeck: React.FC<ReplayControlDeckProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onResetReplay,
  currentIndex,
  totalCandles,
  speedMs,
  onChangeSpeed,
  currentTimestamp,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onStepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onStepForward, onStepBackward]);

  const speeds = [
    { label: '0.1s', ms: 100 },
    { label: '0.25s', ms: 250 },
    { label: '0.5s', ms: 500 },
    { label: '1.0s', ms: 1000 },
  ];

  const formattedDate = currentTimestamp
    ? ForexMath.formatPakistaniTime(currentTimestamp, true)
    : 'Standby';

  const progressPercent = totalCandles > 0 ? (currentIndex / totalCandles) * 100 : 0;

  return (
    <div className="h-11 sm:h-10 bg-white dark:bg-[#000000] border-t border-[#E8DEF4] dark:border-[#1F1F24] px-2 sm:px-3 flex items-center justify-between select-none text-xs text-[#1A1325] dark:text-[#EDEDED] touch-manipulation transition-colors duration-150">
      {/* Control Actions */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        <button
          onClick={onResetReplay}
          title="Reset to Start"
          className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED] rounded-[6px] p-2 sm:p-1.5 transition-colors cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onStepBackward}
          title="Step Backward (Left Arrow)"
          disabled={currentIndex <= 20}
          className="border border-[#E8DEF4] dark:border-[#27272A] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] disabled:opacity-40 text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED] rounded-[6px] px-2.5 py-1.5 sm:py-1 flex items-center space-x-1 transition-colors cursor-pointer active:scale-95"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">Step</span>
        </button>

        <button
          onClick={onTogglePlay}
          title="Play / Pause (Spacebar)"
          className={`border rounded-[6px] px-3 sm:px-3.5 py-1.5 sm:py-1 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95 ${
            isPlaying
              ? 'border-[#F43F5E]/40 bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20'
              : 'border-[#7C3AED] bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={onStepForward}
          title="Step Forward (Right Arrow / Space)"
          className="border border-[#7C3AED]/30 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#7C3AED] rounded-[6px] px-2.5 sm:px-2.5 py-1.5 sm:py-1 font-semibold flex items-center space-x-1 transition-colors cursor-pointer active:scale-95"
        >
          <span className="text-[11px] font-medium hidden sm:inline">Step</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replay Scrubbing & Bar Telemetry: Desktop */}
      <div className="flex-1 max-w-md mx-3 hidden md:flex flex-col space-y-1">
        <div className="flex justify-between items-center text-[11px] text-[#897E9C] dark:text-[#71717A] tabular-figures">
          <span className="truncate mr-2">{formattedDate}</span>
          <span className="shrink-0">
            Bar <strong className="text-[#1A1325] dark:text-[#EDEDED]">{currentIndex}</strong> / {totalCandles}
          </span>
        </div>
        <div className="w-full bg-[#F3EEF9] dark:bg-[#141418] h-1.5 rounded-[3px] overflow-hidden border border-[#E8DEF4] dark:border-[#1F1F24]">
          <div
            className="bg-[#7C3AED] h-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mobile Bar Counter & Mini Progress */}
      <div className="md:hidden flex flex-col items-center justify-center text-[10px] text-[#897E9C] dark:text-[#71717A] tabular-figures px-1.5 leading-tight">
        <span>Bar <strong className="text-[#1A1325] dark:text-[#EDEDED]">{currentIndex}</strong>/{totalCandles}</span>
        <div className="w-16 bg-[#F3EEF9] dark:bg-[#141418] h-1 rounded-[2px] overflow-hidden border border-[#E8DEF4] dark:border-[#1F1F24] mt-0.5">
          <div
            className="bg-[#7C3AED] h-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Speed Selector: Desktop buttons, Mobile select */}
      <div className="flex items-center space-x-1 shrink-0">
        <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] hidden lg:inline mr-1">Speed</span>
        <div className="hidden sm:flex items-center bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] p-0.5 space-x-0.5">
          {speeds.map((s) => (
            <button
              key={s.ms}
              onClick={() => onChangeSpeed(s.ms)}
              className={`px-1.5 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                speedMs === s.ms
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="sm:hidden">
          <select
            value={speedMs}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-[#F3EEF9] dark:hover:bg-[#141418] text-[#7C3AED] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-1.5 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#7C3AED] cursor-pointer"
          >
            {speeds.map((s) => (
              <option key={s.ms} value={s.ms}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
