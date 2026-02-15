import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Mode = "fast" | "high";
type Aspect = "16:9" | "9:16" | "1:1";

type BackendJob = {
  id: string;
  status: string;
  progress: number;
  message: string;
  report: Record<string, unknown>;
  plan: string;
  download_url?: string | null;
};

export type AgentIteration = {
  total: number;
  relevance: number;
  continuity: number;
  variety: number;
  pacing: number;
  technical: number;
  issues?: Array<{ segment_index: number; reason: string; severity: string }>;
};

export type ClientProject = {
  id: string;
  createdAt: number;
  title: string;
  prompt: string;
  lyrics: string;
  mode: Mode;
  aspect: Aspect;
  autoTranscribe: boolean;
  userEmail: string;
  status: string;
  progress: number;
  message: string;
  plan: string;
  report?: Record<string, unknown>;
  downloadUrl?: string | null;
};

export type CreateProjectInput = {
  audio: File;
  title?: string;
  prompt: string;
  lyrics: string;
  mode: Mode;
  aspect: Aspect;
  autoTranscribe: boolean;
};

const STORAGE_KEY = "tunivo_client_projects_v1";
const EMAIL_KEY = "tunivo_client_email_v1";
const PLAN_KEY = "tunivo_client_plan_v1";

function loadProjects(): ClientProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClientProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveProjects(projects: ClientProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function upsertProject(project: ClientProject): void {
  const projects = loadProjects();
  const next = [project, ...projects.filter((p) => p.id !== project.id)];
  saveProjects(next);
}

function removeProject(projectId: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== projectId));
}

function getProject(projectId: string): ClientProject | null {
  return loadProjects().find((p) => p.id === projectId) || null;
}

function mapBackendToProject(existing: ClientProject, latest: BackendJob): ClientProject {
  return {
    ...existing,
    status: latest.status,
    progress: latest.progress,
    message: latest.message,
    plan: latest.plan,
    report: latest.report,
    downloadUrl: latest.download_url ? api(latest.download_url) : null,
  };
}

export function getCurrentEmail(): string {
  return localStorage.getItem(EMAIL_KEY) || "demo@tunivo.local";
}

export function getCurrentPlan(): string {
  return localStorage.getItem(PLAN_KEY) || "free";
}

export async function login(email: string): Promise<{ email: string; plan: string }> {
  const res = await fetch(api("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  const data = (await res.json()) as { email: string; plan: string };
  localStorage.setItem(EMAIL_KEY, data.email);
  localStorage.setItem(PLAN_KEY, data.plan);
  return data;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const projects = loadProjects().sort((a, b) => b.createdAt - a.createdAt);
      return projects;
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const existing = getProject(projectId);
      if (!existing) {
        throw new Error("Project not found");
      }

      try {
        const res = await fetch(api(`/api/jobs/${projectId}`), {
          headers: { "X-User-Email": existing.userEmail || getCurrentEmail() },
        });
        if (!res.ok) {
          return existing;
        }
        const latest = (await res.json()) as BackendJob;
        const merged = mapBackendToProject(existing, latest);
        upsertProject(merged);
        return merged;
      } catch {
        return existing;
      }
    },
    refetchInterval: (query) => {
      const project = query.state.data;
      if (!project) return false;
      return project.status === "completed" || project.status === "failed" ? false : 1500;
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const email = getCurrentEmail();
      const formData = new FormData();
      formData.append("audio", input.audio);
      formData.append("prompt", input.prompt);
      formData.append("lyrics", input.lyrics);
      formData.append("mode", input.mode);
      formData.append("aspect_ratio", input.aspect);
      formData.append("auto_transcribe", String(input.autoTranscribe));

      const res = await fetch(api("/api/jobs"), {
        method: "POST",
        headers: { "X-User-Email": email },
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { detail?: string }).detail || "Failed to create job");
      }

      const data = (await res.json()) as { id: string };
      const initial: ClientProject = {
        id: data.id,
        createdAt: Date.now(),
        title: input.title?.trim() || input.audio.name,
        prompt: input.prompt,
        lyrics: input.lyrics,
        mode: input.mode,
        aspect: input.aspect,
        autoTranscribe: input.autoTranscribe,
        userEmail: email,
        status: "queued",
        progress: 0.02,
        message: "Queued",
        plan: getCurrentPlan(),
      };
      upsertProject(initial);
      return initial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      removeProject(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}
