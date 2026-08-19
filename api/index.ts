import "dotenv/config";
import { buildApp } from "../server/_core/app";

// Vercel Node runtime: a default-exported Express app is wrapped as a serverless function automatically.
export default buildApp();
