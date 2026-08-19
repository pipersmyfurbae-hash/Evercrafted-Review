import fs from "node:fs";
import { execFileSync } from "node:child_process";

const path = "/home/ubuntu/evercrafted-memory-wreath/client/src/pages/Workspace.tsx";
const current = fs.readFileSync(path, "utf8");
const canonical = execFileSync("git", ["show", "HEAD:client/src/pages/Workspace.tsx"], { encoding: "utf8" });
const start = current.indexOf("<<<<<<< Updated upstream");
const end = current.indexOf("\n>>>>>>> Stashed changes", start);
if (start < 0 || end < 0) throw new Error("Workspace conflict markers not found");
const canonicalStart = canonical.indexOf('{tab === "lifestyle"');
const canonicalEnd = canonical.indexOf("\n</div></main>;", canonicalStart);
if (canonicalStart < 0 || canonicalEnd < 0) throw new Error("Canonical Workspace section markers not found");
const replacement = canonical.slice(canonicalStart, canonicalEnd);
fs.writeFileSync(path, current.slice(0, start) + replacement + current.slice(end + "\n>>>>>>> Stashed changes".length));
console.log("resolved Workspace with canonical render-review section");
