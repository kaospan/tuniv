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

export function CreateProjectModal({ children }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<"fast" | "high">("fast");
  const { mutate: createProject, isPending } = useCreateProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, reset } = useForm<{ title: string; prompt: string }>({
    defaultValues: { title: "", prompt: "" },
  });

  const onSubmit = (data: { title: string; prompt: string }) => {
    if (!file) {
      toast({ title: "No audio file", description: "Please upload an MP3 or WAV file.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title || file.name.replace(/\.[^/.]+$/, ""));
    formData.append("prompt", data.prompt || "");
    formData.append("quality", quality);
    formData.append("audio", file);

    createProject(formData, {
      onSuccess: (result: any) => {
        setOpen(false);
        reset();
        setFile(null);
        setQuality("fast");

        if (result.duplicate) {
          toast({ title: "Song Already Exists", description: "Navigating to your existing project. Use Regenerate for a new take." });
          setLocation(`/project/${result.id}`);
        } else {
          toast({ title: "Project Created", description: "Tunivo is analyzing your song and will start generating visuals automatically." });
        }
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
              Upload a song and Tunivo will generate synchronized visuals. Style prompt is optional.
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
                  accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a" 
                  className="hidden" 
                  onChange={handleFileChange}
                  data-testid="input-audio-file"
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {file ? <Music className="w-6 h-6 text-primary" /> : <Upload className="w-6 h-6 text-primary" />}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm text-foreground" data-testid="text-audio-filename">
                    {file ? file.name : "Click to upload audio"}
                  </p>
                  {!file && <p className="text-xs text-muted-foreground">MP3, WAV, or M4A</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground">Project Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="My Awesome Track"
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20"
                data-testid="input-project-title"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt" className="text-muted-foreground">Visual Style Prompt (optional)</Label>
              </div>
              <Textarea
                id="prompt"
                {...register("prompt")}
                placeholder="Leave blank for AI auto-style, or describe your vision..."
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 min-h-[80px]"
                data-testid="input-visual-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty and Tunivo will automatically infer the best visual direction from your music.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Quality Mode</Label>
              <div className="grid grid-cols-2 gap-3" data-testid="toggle-quality-mode">
                <button
                  type="button"
                  onClick={() => setQuality("fast")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    quality === "fast"
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
                  onClick={() => setQuality("high")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                    quality === "high"
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
