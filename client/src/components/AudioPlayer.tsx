import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export interface AudioPlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isLooping: boolean;
}

export interface AudioPlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
}

interface AudioPlayerProps {
  url: string;
  height?: number;
  onPlaybackUpdate?: (state: AudioPlaybackState) => void;
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ url, height = 100, onPlaybackUpdate }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const isDestroyedRef = useRef(false);
    const animFrameRef = useRef<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const callbackRef = useRef(onPlaybackUpdate);
    callbackRef.current = onPlaybackUpdate;

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => wavesurferRef.current?.getCurrentTime() || 0,
      getDuration: () => wavesurferRef.current?.getDuration() || 0,
      getIsPlaying: () => wavesurferRef.current?.isPlaying() || false,
    }));

    const emitState = useCallback(() => {
      if (!wavesurferRef.current) return;
      const ws = wavesurferRef.current;
      const state: AudioPlaybackState = {
        currentTime: ws.getCurrentTime(),
        duration: ws.getDuration(),
        isPlaying: ws.isPlaying(),
        volume,
        isLooping,
      };
      callbackRef.current?.(state);
    }, [volume, isLooping]);

    useEffect(() => {
      if (!containerRef.current) return;

      isDestroyedRef.current = false;
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "rgba(255, 255, 255, 0.15)",
        progressColor: "hsl(263, 90%, 65%)",
        cursorColor: "hsl(190, 90%, 50%)",
        barWidth: 2,
        barRadius: 2,
        barGap: 2,
        height: height,
        normalize: true,
      });

      wavesurferRef.current = ws;
      ws.load(url);

      ws.on("ready", () => {
        setIsReady(true);
        setDuration(ws.getDuration());
        ws.setVolume(volume);
      });

      ws.on("finish", () => {
        setIsPlaying(false);
        if (isLooping) {
          ws.seekTo(0);
          ws.play();
          setIsPlaying(true);
        }
      });

      ws.on("play", () => setIsPlaying(true));
      ws.on("pause", () => setIsPlaying(false));
      ws.on("seeking", () => {
        setCurrentTime(ws.getCurrentTime());
        emitState();
      });
      ws.on("interaction", () => {
        setCurrentTime(ws.getCurrentTime());
        emitState();
      });

      const updateLoop = () => {
        if (ws && !isDestroyedRef.current) {
          setCurrentTime(ws.getCurrentTime());
          emitState();
        }
        animFrameRef.current = requestAnimationFrame(updateLoop);
      };
      animFrameRef.current = requestAnimationFrame(updateLoop);

      return () => {
        isDestroyedRef.current = true;
        cancelAnimationFrame(animFrameRef.current);
        ws.destroy();
      };
    }, [url]);

    useEffect(() => {
      if (wavesurferRef.current && isReady) {
        wavesurferRef.current.setVolume(isMuted ? 0 : volume);
      }
    }, [volume, isMuted, isReady]);

    const togglePlay = () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.playPause();
      }
    };

    const restart = () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.seekTo(0);
        if (!wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.play();
        }
      }
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);
    };

    const toggleLoop = () => {
      setIsLooping(!isLooping);
    };

    const handleVolumeChange = (val: number[]) => {
      setVolume(val[0]);
      if (val[0] > 0 && isMuted) setIsMuted(false);
    };

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
      <div className="bg-card/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm space-y-4" data-testid="audio-player">
        <div
          ref={containerRef}
          className="w-full transition-opacity duration-500 cursor-pointer"
          style={{ opacity: isReady ? 1 : 0.3 }}
          data-testid="audio-waveform"
        />

        {!isReady && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted-foreground">Loading audio...</span>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={restart}
              disabled={!isReady}
              data-testid="button-restart"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <button
              onClick={togglePlay}
              disabled={!isReady}
              className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLoop}
              className={isLooping ? "text-primary" : "text-muted-foreground"}
              disabled={!isReady}
              data-testid="button-loop"
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground min-w-[100px]" data-testid="text-time-display">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 w-32">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-muted-foreground"
              data-testid="button-mute"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="flex-1"
              data-testid="slider-volume"
            />
          </div>
        </div>
      </div>
    );
  }
);
