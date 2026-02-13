import { useState, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { useProject, useGenerateVideo, useRenderVideo, useDeleteProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { AudioPlayer, type AudioPlaybackState, type AudioPlayerHandle } from "@/components/AudioPlayer";
import { VideoPromptPlayer } from "@/components/VideoPromptPlayer";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, ArrowLeft, Wand2, Film, Download, Trash2, 
  Layers, Music, Zap, Sparkles, RefreshCw
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectDetail() {
  const [match, params] = useRoute("/project/:id");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const [audioState, setAudioState] = useState<AudioPlaybackState | null>(null);
  
  const { data: project, isLoading, error } = useProject(id);
  const { mutate: generate, isPending: isGenerating } = useGenerateVideo();
  const { mutate: render, isPending: isRendering } = useRenderVideo();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const handlePlaybackUpdate = useCallback((state: AudioPlaybackState) => {
    setAudioState(state);
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (error || !project) return <div className="h-screen flex items-center justify-center bg-background text-destructive">Project not found</div>;

  const handleGenerate = () => {
    generate(id, {
      onSuccess: () => toast({ title: "Generation Started", description: "Creating clips based on your audio." }),
      onError: () => toast({ title: "Error", description: "Failed to start generation.", variant: "destructive" }),
    });
  };

  const handleRender = () => {
    render(id, {
      onSuccess: () => toast({ title: "Rendering Started", description: "Stitching clips into final video." }),
      onError: () => toast({ title: "Error", description: "Failed to start rendering.", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    deleteProject(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Project removed successfully." });
        setLocation("/");
      },
    });
  };

  const isProcessing = ['analyzing', 'generating', 'rendering', 'ready_to_render'].includes(project.status);
  const progress = project.progress || 0;
  const hasClips = project.clips && project.clips.length > 0;
  const isCompleted = project.status === 'completed';

  const getProgressLabel = () => {
    switch (project.status) {
      case "analyzing": return "Analyzing your music...";
      case "generating": 
        if (project.generatedClips && project.totalClips) {
          return `Generating clip ${project.generatedClips} of ${project.totalClips}...`;
        }
        return "Generating AI visuals...";
      case "ready_to_render": return "Preparing to assemble...";
      case "rendering": return "Rendering final video...";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern pb-20">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <h1 className="font-display font-bold text-lg truncate max-w-[200px] sm:max-w-md" data-testid="text-project-title">
              {project.title}
            </h1>
            <StatusBadge status={project.status} />
            {(project as any).takeNumber > 1 && (
              <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md" data-testid="text-take-number">
                Take {(project as any).takeNumber}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/50 rounded-md p-0.5" data-testid="toggle-performance-mode">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className={`text-xs font-mono pointer-events-none ${
                  project.quality === "fast"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground opacity-50"
                }`}
                data-testid="button-mode-fast"
              >
                <Zap className="w-3 h-3" /> Fast
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className={`text-xs font-mono pointer-events-none ${
                  project.quality === "high"
                    ? "bg-secondary/20 text-secondary"
                    : "text-muted-foreground opacity-50"
                }`}
                data-testid="button-mode-hq"
              >
                <Sparkles className="w-3 h-3" /> HQ
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" data-testid="button-delete-project">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your project and all generated assets.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white" data-testid="button-confirm-delete">
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {isProcessing && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6 space-y-4"
            data-testid="section-progress"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <div>
                  <p className="font-bold text-sm" data-testid="text-progress-label">{getProgressLabel()}</p>
                  <p className="text-xs text-muted-foreground">This may take a few minutes</p>
                </div>
              </div>
              <span className="font-mono text-primary text-sm" data-testid="text-progress-percent">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">

            <section className="space-y-4" data-testid="section-video-player">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
                  <Film className="w-4 h-4" />
                  Video Player
                </div>
                <div className="flex items-center gap-2">
                  {(project.status === 'failed' || isCompleted) && (
                    <Button 
                      onClick={handleGenerate}
                      disabled={isProcessing || isGenerating}
                      variant="outline"
                      className="border-primary/30 text-primary text-xs"
                      data-testid="button-regenerate"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                      {project.status === 'failed' ? 'Retry' : 'Regenerate'}
                    </Button>
                  )}
                  {isCompleted && project.outputVideoUrl && (
                    <a href={project.outputVideoUrl} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-primary/50 text-primary text-xs" data-testid="button-download">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {isCompleted && project.outputVideoUrl ? (
                <div className="aspect-video bg-black rounded-2xl border border-white/5 overflow-hidden" data-testid="video-final-container">
                  <video
                    src={project.outputVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                    data-testid="video-final"
                  />
                </div>
              ) : (
                <VideoPromptPlayer
                  clips={(project.clips || []) as any}
                  audioState={audioState}
                  isProcessing={isProcessing}
                  statusLabel={getProgressLabel()}
                />
              )}
            </section>

            <section className="space-y-4" data-testid="section-audio-player">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
                <Music className="w-4 h-4" />
                Audio Player
              </div>
              <AudioPlayer
                ref={audioPlayerRef}
                url={`/uploads/${project.originalAudioUrl}`}
                height={100}
                onPlaybackUpdate={handlePlaybackUpdate}
              />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {project.duration && (
                  <span data-testid="text-duration">
                    Duration: {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {project.bpm && (
                  <span data-testid="text-bpm">BPM: {project.bpm}</span>
                )}
                {project.mood && (
                  <span className="text-primary/80" data-testid="text-mood-inline">
                    {project.mood}
                  </span>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
              <Layers className="w-4 h-4" />
              Clips
              {project.totalClips ? (
                <span className="text-xs font-mono text-primary ml-auto" data-testid="text-clip-count">
                  {project.generatedClips || 0}/{project.totalClips}
                </span>
              ) : null}
            </div>
              
            <div className="bg-card/30 rounded-2xl border border-white/5 h-[500px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm">Timeline</h3>
                {audioState && hasClips && (
                  <span className="text-[10px] font-mono text-muted-foreground" data-testid="text-playback-time">
                    {Math.floor(audioState.currentTime / 60)}:{Math.floor(audioState.currentTime % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
                
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {hasClips ? (
                  <AnimatePresence>
                    {(() => {
                      const sorted = (project.clips as any[]).sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder);
                      let cumTime = 0;
                      return sorted.map((clip: any, index: number) => {
                        const clipStartTime = cumTime;
                        cumTime += clip.duration;
                        const clipEndTime = cumTime;
                        const isActive = audioState ? audioState.currentTime >= clipStartTime && audioState.currentTime < clipEndTime : false;

                        return (
                          <motion.div
                            key={clip.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex gap-2 p-2 rounded-xl border transition-colors ${
                              isActive 
                                ? "bg-primary/10 border-primary/30" 
                                : "bg-card border-white/5"
                            }`}
                            data-testid={`clip-item-${clip.id}`}
                          >
                            <div className="w-14 h-10 bg-primary/5 rounded-lg overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                              {isActive && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
                              <Film className="w-4 h-4 text-primary/40" />
                              <div className="absolute bottom-0.5 right-0.5 px-1 bg-black/80 rounded text-[9px] font-mono">
                                {clip.duration}s
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className={`text-[11px] font-bold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                                  #{clip.sequenceOrder + 1}
                                </span>
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  {Math.floor(clipStartTime / 60)}:{Math.floor(clipStartTime % 60).toString().padStart(2, '0')}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate" title={clip.promptUsed || ""}>
                                {clip.promptUsed ? clip.promptUsed.substring(0, 50) + "..." : "Audio-driven scene"}
                              </p>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </AnimatePresence>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-60">
                    <Layers className="w-10 h-10 mb-3 stroke-1" />
                    <p className="text-sm">{isProcessing ? "Generating clips..." : "No clips yet"}</p>
                  </div>
                )}
              </div>
            </div>

            {(project.prompt || project.mood || project.lyrics) && (
              <div className="bg-card/30 rounded-2xl border border-white/5 p-4 space-y-3" data-testid="section-analysis">
                {project.mood && (
                  <div>
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Mood</h4>
                    <p className="text-xs text-muted-foreground" data-testid="text-mood">{project.mood}</p>
                  </div>
                )}
                {project.prompt && (
                  <div>
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Visual Style</h4>
                    <p className="text-xs text-muted-foreground line-clamp-4" data-testid="text-visual-prompt">{project.prompt}</p>
                  </div>
                )}
                {project.lyrics && (
                  <div>
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Lyrics</h4>
                    <p className="text-xs text-muted-foreground italic opacity-80 line-clamp-6 whitespace-pre-wrap" data-testid="text-lyrics">{project.lyrics}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
