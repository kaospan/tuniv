import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-projects";
import { composePromptFromPreset, getPromptPreset, PROMPT_PRESETS } from "@/lib/prompt-presets";
import { Check, ChevronLeft, ChevronRight, Loader2, Music, Sparkles, Upload, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateProjectModalProps {
  children: React.ReactNode;
}

type FormValues = {
  title: string;
  presetId: string;
  prompt: string;
  lyrics: string;
  aspect: "16:9" | "9:16" | "1:1";
};

const WIZARD_STEPS = [
  { title: "Track", description: "Upload your song and name the project." },
  { title: "Style", description: "Choose a preset and add optional creative direction." },
  { title: "Format", description: "Pick quality, aspect ratio, and lyric behavior." },
  { title: "Review", description: "Confirm the setup and launch generation." },
] as const;

export function CreateProjectModal({ children }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"fast" | "high">("fast");
  const [autoTranscribe, setAutoTranscribe] = useState(false);
  const { mutate: createProject, isPending } = useCreateProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { title: "", presetId: "none", prompt: "", lyrics: "", aspect: "16:9" },
  });
  const title = watch("title");
  const presetId = watch("presetId");
  const prompt = watch("prompt");
  const lyrics = watch("lyrics");
  const aspect = watch("aspect");
  const selectedPreset = getPromptPreset(presetId);
  const totalSteps = WIZARD_STEPS.length;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const resetWizard = () => {
    reset();
    setFile(null);
    setMode("fast");
    setAutoTranscribe(false);
    setStep(0);
  };

  const canAdvance = () => {
    if (step === 0) {
      return Boolean(file);
    }
    return true;
  };

  const onSubmit = (data: FormValues) => {
    if (!file) {
      toast({ title: "No audio file", description: "Please upload an audio file first.", variant: "destructive" });
      return;
    }

    createProject(
      {
        audio: file,
        title: data.title,
        prompt: composePromptFromPreset(data.presetId, data.prompt),
        lyrics: data.lyrics || "",
        mode,
        aspect: data.aspect,
        autoTranscribe,
      },
      {
        onSuccess: (project) => {
          setOpen(false);
          resetWizard();
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetWizard();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-card/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden rounded-[28px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    New Project Wizard
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    One decision at a time. Tunivo will guide you from upload to launch.
                  </DialogDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step</p>
                  <p className="text-lg font-semibold">
                    {step + 1}
                    <span className="text-muted-foreground">/{totalSteps}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {WIZARD_STEPS.map((wizardStep, index) => {
                    const active = index === step;
                    const completed = index < step;
                    return (
                      <div
                        key={wizardStep.title}
                        className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                          active
                            ? "border-primary/50 bg-primary/10"
                            : completed
                              ? "border-secondary/30 bg-secondary/10"
                              : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                              completed
                                ? "bg-secondary text-secondary-foreground"
                                : active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <p className="font-medium text-sm">{wizardStep.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{wizardStep.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="form-create-project">
              {step === 0 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Audio Track</Label>
                    <div
                      onClick={() => document.getElementById("audio-upload")?.click()}
                      className="border-2 border-dashed border-white/10 rounded-3xl p-8 md:p-10 hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-4 group"
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
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {file ? <Music className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-base text-foreground" data-testid="text-audio-filename">
                          {file ? file.name : "Click to upload your song"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {file ? "Song attached. You can replace it anytime before launch." : "Supported: MP3, WAV, AAC, M4A"}
                        </p>
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
                      placeholder={file?.name.replace(/\.[^/.]+$/, "") || "My Track"}
                      className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 h-12"
                      data-testid="input-project-title"
                    />
                    <p className="text-xs text-muted-foreground">Leave it blank and Tunivo will use the song filename.</p>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="presetId" className="text-muted-foreground">
                      Visual Preset
                    </Label>
                    <select
                      id="presetId"
                      {...register("presetId")}
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      data-testid="select-prompt-preset"
                    >
                      {PROMPT_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm font-medium">{selectedPreset.label}</p>
                      <p className="text-sm text-muted-foreground mt-1" data-testid="text-prompt-preset-description">
                        {selectedPreset.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-muted-foreground">
                      Extra Visual Direction
                    </Label>
                    <Textarea
                      id="prompt"
                      {...register("prompt")}
                      placeholder="Add details like setting, camera language, color palette, or mood"
                      className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 min-h-[120px]"
                      data-testid="input-visual-prompt"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lyrics" className="text-muted-foreground">
                      Lyrics
                    </Label>
                    <Textarea
                      id="lyrics"
                      {...register("lyrics")}
                      placeholder="Paste lyrics or skip this and let Tunivo auto-transcribe later"
                      className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 min-h-[120px]"
                      data-testid="input-lyrics"
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Quality Mode</Label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="toggle-quality-mode">
                      <button
                        type="button"
                        onClick={() => setMode("fast")}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          mode === "fast"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 text-muted-foreground hover:border-white/20"
                        }`}
                        data-testid="button-quality-fast"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Wand2 className="w-4 h-4" />
                          <span className="font-semibold">Fast</span>
                        </div>
                        <p className="text-sm">Quickest turnaround for testing ideas and previews.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("high")}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          mode === "high"
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-white/10 text-muted-foreground hover:border-white/20"
                        }`}
                        data-testid="button-quality-high"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold">High Quality</span>
                        </div>
                        <p className="text-sm">Longer processing for stronger polish and iteration depth.</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aspect" className="text-muted-foreground">
                      Aspect Ratio
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["16:9", "9:16", "1:1"] as const).map((option) => (
                        <label
                          key={option}
                          className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
                            aspect === option
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 text-muted-foreground hover:border-white/20"
                          }`}
                        >
                          <input type="radio" value={option} {...register("aspect")} className="sr-only" />
                          <p className="font-semibold">{option}</p>
                          <p className="mt-1 text-xs">
                            {option === "16:9" ? "Landscape" : option === "9:16" ? "Vertical" : "Square"}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={autoTranscribe}
                      onChange={(e) => setAutoTranscribe(e.target.checked)}
                      className="mt-1"
                      data-testid="checkbox-auto-transcribe"
                    />
                    <div>
                      <p className="font-medium text-foreground">Auto-transcribe lyrics</p>
                      <p className="mt-1">Use this if you did not paste lyrics and want Tunivo to infer timing from the track.</p>
                    </div>
                  </label>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Track</p>
                      <p className="mt-2 font-semibold">{title?.trim() || file?.name || "Untitled project"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{file?.name || "No file selected"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Look</p>
                      <p className="mt-2 font-semibold">{selectedPreset.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{prompt?.trim() || "No extra direction"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Output</p>
                      <p className="mt-2 font-semibold">
                        {mode === "fast" ? "Fast render" : "High quality render"} • {aspect}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {autoTranscribe ? "Auto-transcribe enabled" : lyrics?.trim() ? "Custom lyrics included" : "No lyric guidance"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Prompt Preview</p>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-6">
                        {composePromptFromPreset(presetId, prompt) || "No visual prompt will be added."}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-sm text-secondary-foreground/90">
                    Tunivo is ready. Review the summary above, then launch the project.
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  {!canAdvance() ? "Upload a song to continue." : WIZARD_STEPS[step].description}
                </div>
                <div className="flex items-center gap-3">
                  {step > 0 ? (
                    <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : null}
                  {step < totalSteps - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setStep((current) => current + 1)}
                      disabled={!canAdvance()}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:to-primary"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending || !file}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white font-semibold"
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
                  )}
                </div>
              </div>
            </form>
          </div>

          <aside className="border-l border-white/10 bg-[radial-gradient(circle_at_top,_rgba(113,86,255,0.2),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 md:p-8">
            <div className="sticky top-0 space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Guided Setup</p>
                <h3 className="text-2xl font-display">Make a video without guessing what to fill in next.</h3>
                <p className="text-sm text-muted-foreground">
                  The wizard keeps only the current choice in front of you and saves the rest for the review step.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Current Step</p>
                  <p className="mt-2 text-lg font-semibold">{WIZARD_STEPS[step].title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{WIZARD_STEPS[step].description}</p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Song</p>
                    <p className="mt-2 font-medium">{file?.name || "No file selected yet"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visual Direction</p>
                    <p className="mt-2 font-medium">{selectedPreset.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{prompt?.trim() || "No extra direction yet"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Output Plan</p>
                    <p className="mt-2 font-medium">
                      {mode === "fast" ? "Fast" : "High Quality"} • {aspect}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {autoTranscribe ? "Auto-transcribe on" : lyrics?.trim() ? "Custom lyrics added" : "Lyrics skipped"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
