import "dotenv/config";
import { buildApp } from "./app";

// Vercel Node runtime: a default-exported Express app is wrapped as a serverless function automatically.
// This file is bundled by esbuild into api/index.js at build time (see vercel.json) — Vercel's own
// Node builder does not bundle relative imports, and this project's extensionless imports
// (`./app`, not `./app.js`) don't resolve under plain Node ESM, only under a bundler.
export default buildApp();
