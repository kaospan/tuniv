const DEFAULT_REMOTE_API_BASE = "https://tuniv-backend-production.up.railway.app";

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeApiBase(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const host = value.split(":")[0] || "";
  const candidate = /^https?:\/\//i.test(value)
    ? value
    : isLocalHostname(host)
      ? `http://${value}`
      : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && /railway\.app$/i.test(url.hostname) && url.port === "8000") {
      url.port = "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function resolveApiBase(): string {
  const configuredBase = normalizeApiBase(
    (import.meta.env.VITE_API_BASE as string | undefined) ||
      (import.meta.env.VITE_API_URL as string | undefined),
  );

  if (typeof window !== "undefined" && isLocalHostname(window.location.hostname)) {
    if (!configuredBase) return "";

    try {
      const configuredUrl = new URL(configuredBase);
      if (!isLocalHostname(configuredUrl.hostname)) {
        // Use the Vite proxy in local development to avoid cross-origin failures.
        return "";
      }
    } catch {
      return "";
    }
  }

  return configuredBase || DEFAULT_REMOTE_API_BASE;
}

export const API_BASE = resolveApiBase();

export function api(path: string): string {
  // keep compatibility with existing code that expects api() to return a full URL
  if (!path) return API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return API_BASE ? `${API_BASE}${path}` : path;
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
