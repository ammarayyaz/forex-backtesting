import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, ChevronRight, Play, RotateCcw } from 'lucide-react';

interface MobileIntroAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

export const MobileIntroAnimation: React.FC<MobileIntroAnimationProps> = ({
  isOpen,
  onClose,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsEnded(false);
      setHasStartedPlaying(false);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      if (autoPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setHasStartedPlaying(true))
            .catch(() => {
              // Browser autoplay policy prevented playback
              setHasStartedPlaying(false);
            });
        }
      }
    }
  }, [isOpen, autoPlay]);

  if (!isOpen) return null;

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    setIsEnded(true);
    // Smoothly close after a short graceful pause
    const timer = setTimeout(() => {
      onClose();
    }, 600);
    return () => clearTimeout(timer);
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
      setIsEnded(false);
      setProgress(0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121f32] flex flex-col items-center justify-between select-none touch-manipulation overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Controls Overlay */}
      <header
        className="w-full max-w-[430px] px-4 pt-4 sm:pt-6 pb-2 flex items-center justify-between z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Badge */}
        <div className="flex items-center space-x-2 bg-[#121f32]/80 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs">
          <img
            src="/favicon.png"
            alt="QantFX"
            className="w-4 h-4 object-contain shrink-0"
          />
          <span className="text-white text-[11px] font-bold tracking-tight">QantFX</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
          </button>

          {/* Replay Button if ended */}
          {isEnded && (
            <button
              onClick={handleReplay}
              title="Replay Animation"
              className="h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[11px] font-medium flex items-center space-x-1 backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay</span>
            </button>
          )}

          {/* Skip / Enter Button */}
          <button
            onClick={onClose}
            title="Enter Trading Terminal"
            className="h-7 px-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-medium flex items-center space-x-0.5 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
          >
            <span>Skip</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Video Viewport (9:16 vertical ratio) */}
      <div className="relative flex-1 w-full max-w-[430px] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src="/qantfx-mobile-intro.mp4"
          poster="/qantfx-logo.jpg"
          playsInline
          autoPlay={autoPlay}
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full max-h-[88dvh] object-contain pointer-events-none"
        />

        {/* Soft edge feathering so video perimeter seamlessly melts into background */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_28px_16px_#121f32] z-10" />

        {/* Fallback Play Button if autoplay was blocked */}
        {!hasStartedPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              videoRef.current?.play();
              setHasStartedPlaying(true);
            }}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#38BDF8] text-white flex items-center justify-center shadow-2xl active:scale-95 cursor-pointer z-10"
            title="Play Video"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        )}
      </div>

      {/* Bottom Progress Bar & Prompt */}
      <footer
        className="w-full max-w-[430px] px-4 pb-4 sm:pb-6 pt-2 flex flex-col items-center z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2.5 border border-white/5">
          <div
            className="bg-gradient-to-r from-[#2563EB] to-[#38BDF8] h-full transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-[11px] tracking-wide transition-colors cursor-pointer flex items-center space-x-1"
        >
          <span>Tap anywhere to enter terminal</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </footer>
    </div>
  );
};
