import { useEffect, useMemo, useState } from "react";

type Mode = "fast" | "high";
type Aspect = "16:9" | "9:16" | "1:1";

type JobStatus = {
  id: string;
  status: string;
  progress: number;
  message: string;
  report: Record<string, unknown>;
  plan: string;
  download_url?: string | null;
};

type AgentIteration = {
  total: number;
  relevance: number;
  continuity: number;
  variety: number;
  pacing: number;
  technical: number;
  issues?: Array<{ segment_index: number; reason: string; severity: string }>;
};

type LocalProject = {
  id: string;
  createdAt: number;
  title: string;
  mode: Mode;
  aspect: Aspect;
  status: string;
  progress: number;
  message: string;
  downloadUrl?: string | null;
  report?: Record<string, unknown>;
};

const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const STEPS = ["Analyze", "Generate", "Assemble", "Self-edit", "Export"];

function progressToStep(progress: number): number {
  if (progress < 0.2) return 0;
  if (progress < 0.45) return 1;
  if (progress < 0.65) return 2;
  if (progress < 0.85) return 3;
  return 4;
}

function prettyStatus(value: string): string {
  return value.replace(/_/g, " ");
}

export default function App() {
  const [email, setEmail] = useState("demo@tunivo.local");
  const [plan, setPlan] = useState("free");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [mode, setMode] = useState<Mode>("fast");
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [autoTranscribe, setAutoTranscribe] = useState(false);

  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobStatus | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const activeProject = useMemo(() => {
    if (!activeJobId) return null;
    return projects.find((p) => p.id === activeJobId) || null;
  }, [projects, activeJobId]);

  const activeStep = progressToStep(activeJob?.progress || activeProject?.progress || 0);

  async function login() {
    setError("");
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setError("Login failed");
      return;
    }
    const data = await res.json();
    setEmail(data.email);
    setPlan(data.plan);
  }

  async function createProject() {
    setError("");
    if (!audioFile) {
      setError("Upload an audio track first");
      return;
    }

    setIsCreating(true);
    try {
      const form = new FormData();
      form.append("audio", audioFile);
      form.append("prompt", prompt);
      form.append("lyrics", lyrics);
      form.append("mode", mode);
      form.append("aspect_ratio", aspect);
      form.append("auto_transcribe", String(autoTranscribe));

      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: { "X-User-Email": email },
        body: form,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to create job");
      }

      const data = await res.json();
      const project: LocalProject = {
        id: data.id,
        createdAt: Date.now(),
        title: audioFile.name,
        mode,
        aspect,
        status: "queued",
        progress: 0.02,
        message: "Queued",
      };
      setProjects((prev) => [project, ...prev]);
      setActiveJobId(data.id);
      setActiveJob({
        id: data.id,
        status: "queued",
        progress: 0.02,
        message: "Queued",
        report: {},
        plan,
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unexpected error";
      setError(text);
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    if (!activeJobId) return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${activeJobId}`, {
          headers: { "X-User-Email": email },
        });
        if (!res.ok) {
          return;
        }
        const latest = (await res.json()) as JobStatus;
        setActiveJob(latest);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === latest.id
              ? {
                  ...p,
                  status: latest.status,
                  progress: latest.progress,
                  message: latest.message,
                  report: latest.report,
                  downloadUrl: latest.download_url ? `${API_BASE}${latest.download_url}` : null,
                }
              : p
          )
        );

        if (latest.status === "completed" || latest.status === "failed") {
          window.clearInterval(interval);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 1500);

    return () => window.clearInterval(interval);
  }, [activeJobId, email]);

  const iterations = useMemo(() => {
    const source = (activeJob?.report?.iterations || activeProject?.report?.iterations) as AgentIteration[] | undefined;
    return source || [];
  }, [activeJob, activeProject]);

  const issues = useMemo(() => {
    if (iterations.length === 0) return [] as AgentIteration["issues"];
    return iterations[iterations.length - 1].issues || [];
  }, [iterations]);

  const previewUrl = activeProject?.downloadUrl || null;

  return (
    <div className="appShell">
      <header className="topBar">
        <div>
          <p className="brandKicker">Tunivo.ai</p>
          <h1>Tunivo Studio</h1>
          <p className="subtitle">Turn music into motion with an autonomous self-editing director.</p>
        </div>
        <span className="agentBadge">Self-Editing Agent: On</span>
      </header>

      <section className="studioGrid">
        <aside className="leftCol">
          <div className="card loginCard">
            <h2>Identity</h2>
            <div className="row">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@creator.tunivo" />
              <button onClick={login}>Login</button>
            </div>
            <p className="meta">Plan: {plan}</p>
          </div>

          <div className="card createCard">
            <h2>New Project</h2>
            <label>
              Track Upload
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </label>
            <label>
              Visual Style Prompt (optional)
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Cinematic dusk skyline, reflective water, slow dolly shots" />
            </label>
            <label>
              Lyrics (optional)
              <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Paste lyrics or use auto-transcribe" />
            </label>
            <div className="inlineControls">
              <div className="modeGroup">
                <button className={mode === "fast" ? "pill active" : "pill"} onClick={() => setMode("fast")}>
                  Fast
                </button>
                <button className={mode === "high" ? "pill active" : "pill"} onClick={() => setMode("high")}>
                  High Quality
                </button>
              </div>
              <select value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)}>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
            <label className="checkboxRow">
              <input type="checkbox" checked={autoTranscribe} onChange={(e) => setAutoTranscribe(e.target.checked)} />
              Auto-transcribe
            </label>
            {error ? <p className="errorText">{error}</p> : null}
            <button className="primaryBtn" onClick={createProject} disabled={isCreating}>
              {isCreating ? "Submitting..." : "Generate Music Video"}
            </button>
          </div>

          <div className="card projectsCard">
            <h2>Projects</h2>
            {projects.length === 0 ? <p className="empty">No projects yet.</p> : null}
            <div className="projectList">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === activeJobId ? "projectItem active" : "projectItem"}
                  onClick={() => setActiveJobId(project.id)}
                >
                  <div>
                    <strong>{project.title}</strong>
                    <p>{new Date(project.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <span>{prettyStatus(project.status)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="rightCol">
          <div className="card statusCard">
            <h2>Project Detail</h2>
            {activeProject ? (
              <>
                <div className="statsRow">
                  <div>
                    <p className="label">Status</p>
                    <p>{prettyStatus(activeProject.status)}</p>
                  </div>
                  <div>
                    <p className="label">Progress</p>
                    <p>{Math.round(activeProject.progress * 100)}%</p>
                  </div>
                  <div>
                    <p className="label">Mode</p>
                    <p>{activeProject.mode}</p>
                  </div>
                </div>
                <div className="stepsRow">
                  {STEPS.map((step, idx) => (
                    <span key={step} className={idx <= activeStep ? "step active" : "step"}>
                      {step}
                    </span>
                  ))}
                </div>
                <p className="message">{activeProject.message}</p>
              </>
            ) : (
              <p className="empty">Select a project to inspect details.</p>
            )}
          </div>

          <div className="card scoreCard">
            <h2>Agent Scorecard</h2>
            {iterations.length === 0 ? <p className="empty">No iterations yet.</p> : null}
            {iterations.map((it, idx) => (
              <div key={`${it.total}-${idx}`} className="iterationRow">
                <strong>Iteration {idx + 1}</strong>
                <span>Total {it.total}</span>
                <span>Rel {it.relevance}</span>
                <span>Cont {it.continuity}</span>
                <span>Var {it.variety}</span>
                <span>Pace {it.pacing}</span>
              </div>
            ))}
            {issues && issues.length > 0 ? (
              <div className="issuesBox">
                <h3>Current Issues</h3>
                <ul>
                  {issues.map((issue, idx) => (
                    <li key={`${issue.reason}-${idx}`}>
                      Segment {issue.segment_index}: {issue.reason} ({issue.severity})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="card previewCard">
            <div className="previewHeader">
              <h2>Preview</h2>
              {previewUrl ? (
                <a className="downloadLink" href={previewUrl} target="_blank" rel="noreferrer">
                  Download MP4
                </a>
              ) : null}
            </div>
            <div className="player">
              {previewUrl ? <video controls src={previewUrl} /> : <div className="empty">Rendered output appears here.</div>}
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
