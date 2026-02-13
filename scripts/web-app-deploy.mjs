import path from "node:path";
import { readActiveApp, runBun, getRoot } from "./web-app-utils.mjs";

const app = readActiveApp();
const distPath = path.join(app, "dist");

console.log(`Deploying active web app: ${app}`);
runBun(["run", "--cwd", app, "build"]);
runBun(["x", "gh-pages", "-d", distPath, "-b", "gh-pages"], getRoot());
