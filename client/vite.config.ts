import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
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
        target: process.env.VITE_API_BASE || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p,
      },
    },
  },
});
