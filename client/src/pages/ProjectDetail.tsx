import { useMemo } from "react";
import { useRoute } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Download, Layers, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const STEPS = ["Analyze", "Generate", "Assemble", "Self-edit", "Export"];

function progressToStep(progress: number): number {
  if (progress < 0.2) return 0;
  if (progress < 0.45) return 1;
  if (progress < 0.65) return 2;
  if (progress < 0.85) return 3;
  return 4;
}

type AgentIteration = {
  total: number;
  relevance: number;
  continuity: number;
  variety: number;
  pacing: number;
  technical: number;
  issues?: Array<{ segment_index: number; reason: string; severity: string }>;
};

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const id = params?.id || "";
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-destructive">
        Project not found
      </div>
    );
  }

  const activeStep = progressToStep(project.progress || 0);
  const iterations = ((project.report?.iterations || []) as AgentIteration[]) ?? [];
  const issues = iterations.length > 0 ? iterations[iterations.length - 1].issues || [] : [];
  const percent = Math.max(0, Math.min(100, Math.round((project.progress || 0) * 100)));

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
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Plan: {project.plan}</span>
            {project.downloadUrl ? (
              <a href={project.downloadUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="border-primary/50 text-primary text-xs" data-testid="button-download">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="glass-panel rounded-2xl p-6 space-y-4" data-testid="section-progress">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm" data-testid="text-progress-label">
                {project.message || project.status}
              </p>
              <p className="text-xs text-muted-foreground">Job ID: {project.id}</p>
            </div>
            <span className="font-mono text-primary text-sm" data-testid="text-progress-percent">
              {percent}%
            </span>
          </div>
          <Progress value={percent} className="h-2" data-testid="progress-bar" />
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, idx) => (
              <span
                key={step}
                className={`px-2 py-1 rounded-md text-xs border ${idx <= activeStep ? "bg-primary/10 border-primary/40 text-primary" : "border-white/10 text-muted-foreground"}`}
              >
                {step}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
              <Layers className="w-4 h-4" />
              Preview
            </div>
            <div className="aspect-video bg-black rounded-2xl border border-white/5 overflow-hidden relative">
              {project.downloadUrl ? (
                <video src={project.downloadUrl} controls className="w-full h-full object-contain" data-testid="video-final" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-grid-pattern">
                  <p className="font-mono uppercase tracking-widest text-sm">{project.message || "Rendering output will appear here"}</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
              Agent Scorecard
            </div>
            <div className="bg-card/30 rounded-2xl border border-white/5 p-4 space-y-3">
              {iterations.length === 0 ? <p className="text-xs text-muted-foreground">No iterations yet.</p> : null}
              {iterations.map((it, idx) => (
                <div key={`${it.total}-${idx}`} className="text-xs border border-white/10 rounded-md p-2">
                  <p className="font-semibold mb-1">Iteration {idx + 1}</p>
                  <p>Total: {it.total}</p>
                  <p>Relevance: {it.relevance}</p>
                  <p>Continuity: {it.continuity}</p>
                  <p>Variety: {it.variety}</p>
                  <p>Pacing: {it.pacing}</p>
                </div>
              ))}

              {issues.length > 0 ? (
                <div className="border border-red-500/30 bg-red-500/5 rounded-md p-2">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Current Issues
                  </p>
                  <ul className="text-xs space-y-1">
                    {issues.map((issue, idx) => (
                      <li key={`${issue.reason}-${idx}`}>
                        Segment {issue.segment_index}: {issue.reason} ({issue.severity})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
