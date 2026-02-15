export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "https://tuniv-backend-production.up.railway.app";

export function api(path: string): string {
  // keep compatibility with existing code that expects api() to return a full URL
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, opts?: RequestInit) {
  const url = api(path);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err: any = new Error(`API error ${res.status}: ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return await res.text();
}
