import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const STEPS = ["Analyze", "Generate", "Assemble", "Self-edit", "Export"];

function stageFromProgress(progress) {
  if (progress < 0.2) return 0;
  if (progress < 0.5) return 1;
  if (progress < 0.7) return 2;
  if (progress < 0.85) return 3;
  return 4;
}

export default function App() {
  const [email, setEmail] = useState("producer@creator.com");
  const [plan, setPlan] = useState("free");
  const [audioFile, setAudioFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [autoTranscribe, setAutoTranscribe] = useState(false);
  const [mode, setMode] = useState("fast");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeStep = stageFromProgress(job?.progress || 0);

  async function handleLogin() {
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

  async function handleGenerate(evt) {
    evt.preventDefault();
    if (!audioFile) {
      setError("Upload a song first");
      return;
    }

    setError("");
    setBusy(true);
    setJob(null);

    const fd = new FormData();
    fd.append("audio", audioFile);
    fd.append("prompt", prompt);
    fd.append("lyrics", lyrics);
    fd.append("mode", mode);
    fd.append("aspect_ratio", aspectRatio);
    fd.append("auto_transcribe", String(autoTranscribe));

    const createRes = await fetch(`${API_BASE}/api/jobs`, {
      method: "POST",
      headers: { "X-User-Email": email },
      body: fd,
    });

    if (!createRes.ok) {
      setBusy(false);
      setError("Job creation failed");
      return;
    }

    const createData = await createRes.json();
    pollJob(createData.id);
  }

  function pollJob(jobId) {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) {
        clearInterval(interval);
        setBusy(false);
        setError("Failed to fetch job status");
        return;
      }
      const data = await res.json();
      setJob(data);
      if (data.status === "completed" || data.status === "failed") {
        clearInterval(interval);
        setBusy(false);
      }
    }, 1500);
  }

  const iterationRows = useMemo(() => {
    const report = job?.report;
    if (!report?.iterations) return [];
    return report.iterations.map((it, idx) => {
      const score = it.scorecard || it;
      return {
        idx: idx + 1,
        total: score.total,
        relevance: score.relevance,
        continuity: score.continuity,
        variety: score.variety,
        pacing: score.pacing,
      };
    });
  }, [job]);

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Tunivo.ai</p>
        <h1>Tunivo Studio</h1>
        <p>Generate Music Video with Self-Editing Agent: On</p>
      </header>

      <section className="panel auth">
        <label>Email Login</label>
        <div className="row">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
          <button onClick={handleLogin}>Login</button>
        </div>
        <small>Plan: {plan}</small>
      </section>

      <form className="panel" onSubmit={handleGenerate}>
        <label>Song Upload</label>
        <input type="file" accept=".mp3,.wav,.aac,audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />

        <label>Visual Style Prompt (optional)</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Neon city rain, cinematic street dance, surreal reflections" />

        <label>Lyrics (optional)</label>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Paste lyrics or enable auto-transcribe" />

        <div className="row options">
          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="fast">Fast</option>
              <option value="high">High Quality</option>
            </select>
          </label>

          <label>
            Aspect Ratio
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={autoTranscribe} onChange={(e) => setAutoTranscribe(e.target.checked)} />
            Auto-transcribe
          </label>
        </div>

        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Generating..." : "Generate Music Video"}
        </button>
      </form>

      <section className="panel">
        <h3>Progress</h3>
        <div className="steps">
          {STEPS.map((step, idx) => (
            <span key={step} className={idx <= activeStep ? "step active" : "step"}>
              {step}
            </span>
          ))}
        </div>
        <p>{job ? `${job.status} - ${Math.round(job.progress * 100)}% - ${job.message}` : "Idle"}</p>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h3>Self-Editing Agent Scorecard</h3>
        {iterationRows.length === 0 ? <p>No iterations yet.</p> : null}
        {iterationRows.map((row) => (
          <div key={row.idx} className="scoreRow">
            <strong>Iteration {row.idx}</strong>
            <span>Total {row.total}</span>
            <span>Rel {row.relevance}</span>
            <span>Cont {row.continuity}</span>
            <span>Var {row.variety}</span>
            <span>Pace {row.pacing}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Preview + Download</h3>
        {job?.download_url ? (
          <>
            <video controls src={`${API_BASE}${job.download_url}`} className="preview" />
            <a href={`${API_BASE}${job.download_url}`} className="download">Download MP4</a>
          </>
        ) : (
          <p>Video appears here after export.</p>
        )}
      </section>
    </div>
  );
}
