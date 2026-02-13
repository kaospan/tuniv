import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-projects";
import { Upload, Music, Loader2, Zap, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateProjectModalProps {
  children: React.ReactNode;
}

type FormValues = {
  title: string;
  prompt: string;
  lyrics: string;
  aspect: "16:9" | "9:16" | "1:1";
};

export function CreateProjectModal({ children }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"fast" | "high">("fast");
  const [autoTranscribe, setAutoTranscribe] = useState(false);
  const { mutate: createProject, isPending } = useCreateProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { title: "", prompt: "", lyrics: "", aspect: "16:9" },
  });

  const onSubmit = (data: FormValues) => {
    if (!file) {
      toast({ title: "No audio file", description: "Please upload an audio file first.", variant: "destructive" });
      return;
    }

    createProject(
      {
        audio: file,
        title: data.title,
        prompt: data.prompt || "",
        lyrics: data.lyrics || "",
        mode,
        aspect: data.aspect,
        autoTranscribe,
      },
      {
        onSuccess: (project) => {
          setOpen(false);
          reset();
          setFile(null);
          setMode("fast");
          setAutoTranscribe(false);
          toast({ title: "Project Created", description: "Tunivo started your generation job." });
          setLocation(`/project/${project.id}`);
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Could not create project";
          toast({ title: "Error", description: message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              New Project
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Upload a track and configure style, quality, and aspect ratio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="form-create-project">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Audio Track</Label>
              <div
                onClick={() => document.getElementById("audio-upload")?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-3 group"
                data-testid="dropzone-audio-upload"
              >
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  data-testid="input-audio-file"
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {file ? <Music className="w-6 h-6 text-primary" /> : <Upload className="w-6 h-6 text-primary" />}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm text-foreground" data-testid="text-audio-filename">
                    {file ? file.name : "Click to upload audio"}
                  </p>
                  {!file && <p className="text-xs text-muted-foreground">MP3, WAV, AAC, M4A</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground">
                Project Title
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="My Track"
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20"
                data-testid="input-project-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-muted-foreground">
                Visual Style Prompt (optional)
              </Label>
              <Textarea
                id="prompt"
                {...register("prompt")}
                placeholder="Cinematic dusk skyline, reflective water, slow dolly shots"
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 min-h-[80px]"
                data-testid="input-visual-prompt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lyrics" className="text-muted-foreground">
                Lyrics (optional)
              </Label>
              <Textarea
                id="lyrics"
                {...register("lyrics")}
                placeholder="Paste lyrics or enable auto-transcribe"
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 min-h-[80px]"
                data-testid="input-lyrics"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Quality Mode</Label>
              <div className="grid grid-cols-2 gap-3" data-testid="toggle-quality-mode">
                <button
                  type="button"
                  onClick={() => setMode("fast")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    mode === "fast"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                  data-testid="button-quality-fast"
                >
                  <Zap className="w-4 h-4" />
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => setMode("high")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    mode === "high"
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                  data-testid="button-quality-high"
                >
                  <Sparkles className="w-4 h-4" />
                  High Quality
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect" className="text-muted-foreground">
                Aspect Ratio
              </Label>
              <select
                id="aspect"
                {...register("aspect")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="select-aspect-ratio"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoTranscribe}
                onChange={(e) => setAutoTranscribe(e.target.checked)}
                data-testid="checkbox-auto-transcribe"
              />
              Auto-transcribe lyrics
            </label>

            <Button
              type="submit"
              disabled={isPending || !file}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white font-semibold py-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all"
              data-testid="button-create-project"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Project...
                </>
              ) : (
                "Generate Video"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
