import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeProxyTarget(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return "http://127.0.0.1:8000";

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
    return url.origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = normalizeProxyTarget(
    env.VITE_API_PROXY_TARGET || env.VITE_API_BASE || env.VITE_API_URL,
  );

  return {
    plugins: [react()],
    base: "/tuniv/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5176,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p,
        },
      },
    },
  };
});
