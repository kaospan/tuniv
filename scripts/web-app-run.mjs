import { readActiveApp, runBun } from "./web-app-utils.mjs";

const script = process.argv[2] || "dev";
const app = readActiveApp();

console.log(`Running "${script}" for active web app: ${app}`);
runBun(["run", "--cwd", app, script]);
