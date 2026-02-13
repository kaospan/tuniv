import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "web-app.config.json");
const VALID_APPS = new Set(["frontend", "client"]);

export function getRoot() {
  return ROOT;
}

export function getConfigPath() {
  return CONFIG_PATH;
}

export function readActiveApp() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const active = parsed?.active;
  if (!VALID_APPS.has(active)) {
    throw new Error(`Invalid web app "${active}" in ${CONFIG_PATH}. Use "frontend" or "client".`);
  }
  return active;
}

export function writeActiveApp(app) {
  if (!VALID_APPS.has(app)) {
    throw new Error(`Invalid app "${app}". Use "frontend" or "client".`);
  }
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify({ active: app }, null, 2)}\n`, "utf8");
}

export function runBun(args, cwd = ROOT) {
  const result = spawnSync("bun", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
