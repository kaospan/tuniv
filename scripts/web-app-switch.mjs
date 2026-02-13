import { writeActiveApp, getConfigPath } from "./web-app-utils.mjs";

const app = process.argv[2];
if (!app) {
  console.error('Usage: node scripts/web-app-switch.mjs <frontend|client>');
  process.exit(1);
}

try {
  writeActiveApp(app);
  console.log(`Active web app set to "${app}" in ${getConfigPath()}`);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
