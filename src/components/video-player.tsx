"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

export type VideoPlayerProps = {
  src: string;
  poster?: string;
  duration: number; // expected seconds
  initialWatched?: number;
  onProgress?: (watched: number) => void;
  onComplete?: () => void;
  className?: string;
};

export function VideoPlayer({
  src,
  poster,
  duration,
  initialWatched = 0,
  onProgress,
  onComplete,
  className,
}: VideoPlayerProps) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(initialWatched);
  const [muted, setMuted] = React.useState(false);
  const [completed, setCompleted] = React.useState(initialWatched >= duration);
  const lastReportedRef = React.useRef(initialWatched);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (initialWatched > 0 && initialWatched < duration) {
      v.currentTime = initialWatched;
    }
  }, [initialWatched, duration]);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const onTime = () => {
      const t = Math.floor(v.currentTime);
      setCurrent(t);
      if (t - lastReportedRef.current >= 5) {
        lastReportedRef.current = t;
        onProgress?.(t);
      }
    };
    const onEnded = () => {
      onProgress?.(duration);
      lastReportedRef.current = duration;
      setCompleted(true);
      onComplete?.();
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      // Final flush
      onProgress?.(Math.floor(v.currentTime));
    };
  }, [duration, onProgress, onComplete]);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }
  function toggleMute() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function fullscreen() {
    const v = ref.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen?.();
  }

  const pct = Math.min(100, (current / Math.max(1, duration)) * 100);

  return (
    <div
      className={cn(
        "relative group bg-[var(--color-ink)] overflow-hidden",
        className,
      )}
    >
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        className="block w-full aspect-video object-cover bg-[var(--color-ink)]"
        onClick={toggle}
      />

      {/* Overlay center play button */}
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center group/play"
          aria-label="Play"
        >
          <span className="h-20 w-20 flex items-center justify-center bg-[var(--color-brand)] text-white group-hover/play:scale-110 transition-transform shadow-2xl">
            <Play className="h-9 w-9 fill-current ml-1" />
          </span>
        </button>
      )}

      {/* Status badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.14em] text-white">
          {completed ? "✓ Watched" : playing ? "● Playing" : "Paused"}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pt-10 pb-4">
        {/* Progress bar */}
        <div className="h-1 bg-white/20 mb-4 relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-brand)] transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-white">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <span className="font-mono text-xs tracking-wider">
            {formatDuration(current)} / {formatDuration(duration)}
          </span>
          <div className="flex-1" />
          <button onClick={fullscreen} aria-label="Fullscreen">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
