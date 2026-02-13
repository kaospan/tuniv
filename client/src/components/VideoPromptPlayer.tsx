import { useEffect, useRef, useState, useMemo } from "react";
import { type AudioPlaybackState } from "./AudioPlayer";
import { Film } from "lucide-react";

interface ClipData {
  id: number;
  url: string;
  duration: number;
  sequenceOrder: number;
  status: string;
}

interface VideoPromptPlayerProps {
  clips: ClipData[];
  audioState: AudioPlaybackState | null;
  isProcessing: boolean;
  statusLabel: string;
}

export function VideoPromptPlayer({ clips, audioState, isProcessing, statusLabel }: VideoPromptPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeClipIndex, setActiveClipIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevClipIndexRef = useRef(-1);

  const sortedClips = useMemo(() => {
    return [...clips]
      .filter(c => c.status === "generated")
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [clips]);

  const clipTimings = useMemo(() => {
    let cumulative = 0;
    return sortedClips.map(clip => {
      const start = cumulative;
      cumulative += clip.duration;
      return { ...clip, startTime: start, endTime: cumulative };
    });
  }, [sortedClips]);

  useEffect(() => {
    if (!audioState || clipTimings.length === 0) return;

    const currentTime = audioState.currentTime;
    let foundIndex = -1;

    for (let i = 0; i < clipTimings.length; i++) {
      if (currentTime >= clipTimings[i].startTime && currentTime < clipTimings[i].endTime) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex === -1 && currentTime >= 0 && clipTimings.length > 0) {
      if (currentTime < clipTimings[0].startTime) {
        foundIndex = 0;
      } else {
        foundIndex = clipTimings.length - 1;
      }
    }

    if (foundIndex !== activeClipIndex) {
      if (prevClipIndexRef.current !== -1 && foundIndex !== -1) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 300);
      }
      prevClipIndexRef.current = activeClipIndex;
      setActiveClipIndex(foundIndex);
    }
  }, [audioState?.currentTime, clipTimings, activeClipIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !audioState || activeClipIndex < 0 || activeClipIndex >= clipTimings.length) return;

    const clip = clipTimings[activeClipIndex];
    const clipLocalTime = Math.max(0, Math.min(audioState.currentTime - clip.startTime, clip.duration - 0.1));
    const expectedSrc = clip.url;

    if (!video.src.endsWith(expectedSrc)) {
      video.src = expectedSrc;
      video.currentTime = clipLocalTime;
    } else {
      const drift = Math.abs(video.currentTime - clipLocalTime);
      if (drift > 0.5) {
        video.currentTime = clipLocalTime;
      }
    }

    if (audioState.isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!audioState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [audioState?.currentTime, audioState?.isPlaying, activeClipIndex, clipTimings]);

  const hasClips = sortedClips.length > 0;
  const activeClip = activeClipIndex >= 0 && activeClipIndex < clipTimings.length ? clipTimings[activeClipIndex] : null;

  const totalClipDuration = clipTimings.length > 0 ? clipTimings[clipTimings.length - 1].endTime : 0;
  const progressPercent = audioState && totalClipDuration > 0 
    ? Math.min(100, (audioState.currentTime / totalClipDuration) * 100) 
    : 0;

  return (
    <div className="space-y-3" data-testid="video-prompt-player">
      <div className="aspect-video bg-black rounded-2xl border border-white/5 overflow-hidden relative" data-testid="video-display">
        {hasClips && activeClip ? (
          <>
            <video
              ref={videoRef}
              className={`w-full h-full object-contain transition-opacity duration-300 ${isTransitioning ? "opacity-70" : "opacity-100"}`}
              muted
              playsInline
              data-testid="video-clip-element"
            />
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 rounded-md text-[10px] font-mono text-white/70" data-testid="text-clip-indicator">
              Clip {activeClipIndex + 1}/{sortedClips.length}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-grid-pattern">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="font-mono text-primary uppercase tracking-widest text-sm" data-testid="text-processing-status">
                  {statusLabel}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-50">
                <Film className="w-16 h-16" />
                <p data-testid="text-no-video">No visuals generated yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {hasClips && (
        <div className="space-y-1">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
              data-testid="video-progress-bar"
            />
          </div>
          <div className="flex gap-0.5">
            {clipTimings.map((clip, i) => (
              <div
                key={clip.id}
                className={`h-0.5 rounded-full transition-colors ${
                  i === activeClipIndex ? "bg-primary" : i < activeClipIndex ? "bg-primary/40" : "bg-white/10"
                }`}
                style={{ flex: clip.duration }}
                data-testid={`video-clip-segment-${i}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
