const COMETAPI_BASE_URL = "https://api.cometapi.com";
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_MAX_POLLS = 120;
export const DEFAULT_MIDJOURNEY_PARAMETERS = "--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7";

export function assembleMidjourneyPrompt(prompt: string, parameters = DEFAULT_MIDJOURNEY_PARAMETERS) {
  const trimmed = prompt.trim();
  if (!parameters || trimmed.includes("--v ")) return trimmed;
  return `${trimmed} ${parameters}`.trim();
}

type JsonRecord = Record<string, unknown>;

export type CometOperation = "imagine" | "describe" | "blend" | "action" | "upscale";

export type CometTaskResult = {
  taskId: string;
  status: "success" | "failure";
  imageUrl: string | null;
  raw: JsonRecord;
};

export type CometRenderRequest = {
  operation: CometOperation;
  prompt?: string;
  sourceTaskId?: string;
  index?: number;
  sourceImageUrls?: string[];
  mode?: "FAST" | "TURBO";
  model?: string;
  parameters?: string;
};

function getApiKey() {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured.");
  return apiKey;
}

function findString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  for (const key of keys) {
    const candidate = (value as JsonRecord)[key];
    if ((typeof candidate === "string" || typeof candidate === "number") && String(candidate).trim()) return String(candidate);
  }
  for (const child of Object.values(value as JsonRecord)) {
    const nested = findString(child, keys);
    if (nested) return nested;
  }
  return null;
}

function findStatus(value: unknown): "success" | "failure" | "pending" {
  if (findImageUrl(value)) return "success";
  const failure = findString(value, ["failReason", "failureReason", "errorMessage"]);
  if (failure) return "failure";
  const raw = findString(value, ["status", "state", "taskStatus"])?.toLowerCase();
  if (raw && ["success", "succeeded", "completed", "done", "finished"].includes(raw)) return "success";
  if (raw && ["failure", "failed", "error", "cancelled", "canceled"].includes(raw)) return "failure";
  const finishTime = Number(findString(value, ["finishTime", "finishedAt"]));
  if (Number.isFinite(finishTime) && finishTime > 0) return "success";
  return "pending";
}

function findImageUrl(value: unknown): string | null {
  const direct = findString(value, ["imageUrl", "image_url", "outputUrl", "output_url", "downloadUrl", "download_url", "image", "images", "result", "output", "url", "uri"]);
  if (direct && /^https?:\/\//.test(direct)) return direct;
  if (!value || typeof value !== "object") return null;
  for (const child of Object.values(value as JsonRecord)) {
    const nested = findImageUrl(child);
    if (nested) return nested;
  }
  return null;
}

function findTaskId(value: unknown): string | null {
  return findString(value, ["task_id", "taskId", "taskID", "job_id", "jobId", "request_id", "requestId", "generation_id", "generationId", "result", "id"]);
}

function summarizePayload(value: unknown) {
  try { return JSON.stringify(value).slice(0, 1200); } catch { return "[unserializable provider response]"; }
}

async function requestJson(path: string, init: RequestInit): Promise<JsonRecord> {
  const response = await fetch(`${COMETAPI_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload: unknown = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) throw new Error(`CometAPI ${response.status}: ${typeof payload === "object" ? JSON.stringify(payload) : text}`);
  return (payload && typeof payload === "object" ? payload : {}) as JsonRecord;
}

function buildSubmission(request: CometRenderRequest) {
  const mode = request.mode ?? (request.operation === "describe" || request.operation === "action" ? "TURBO" : "FAST");
  if (request.operation === "upscale") {
    if (!request.sourceTaskId) throw new Error("Upscale requires a source task ID.");
    return { path: "/v1/tasks", body: { model: request.model ?? "mj-fast-upscale-subtle", input: { task_id: request.sourceTaskId, index: request.index ?? 1 } }, pollPath: (taskId: string) => `/mj/task/${encodeURIComponent(taskId)}/fetch` };
  }
  const pathByOperation: Record<Exclude<CometOperation, "upscale">, string> = { imagine: "/mj/submit/imagine", describe: "/mj/submit/describe", blend: "/mj/submit/blend", action: "/mj/submit/action" };
  const prompt = request.operation === "imagine" && request.model === "mj-fast-imagine" ? assembleMidjourneyPrompt(request.prompt ?? "", request.parameters) : request.prompt ?? "";
  const body: JsonRecord = { prompt, botType: "MID_JOURNEY", accountFilter: { modes: [mode] } };
  if (request.sourceTaskId) body.sourceTaskId = request.sourceTaskId;
  if (request.sourceImageUrls?.length) body.imageUrls = request.sourceImageUrls;
  if (request.index !== undefined) body.index = request.index;
  return { path: pathByOperation[request.operation], body, pollPath: (taskId: string) => `/mj/task/${encodeURIComponent(taskId)}/fetch` };
}

export async function downloadCometImage(imageUrl: string) {
  if (!/^https?:\/\//.test(imageUrl)) throw new Error("CometAPI returned an invalid image URL.");
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Unable to download CometAPI image (${response.status}).`);
  const contentType = response.headers.get("content-type") ?? "image/png";
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType };
}

type CometSubmission = { taskId: string; pollPath: (taskId: string) => string; immediate: CometTaskResult | null };

export async function submitCometTask(request: CometRenderRequest): Promise<CometSubmission> {
  const submission = buildSubmission(request);
  const created = await requestJson(submission.path, { method: "POST", body: JSON.stringify(submission.body) });
  const taskId = findTaskId(created);
  if (!taskId) {
    const imageUrl = findImageUrl(created);
    if (!imageUrl) throw new Error(`CometAPI returned neither a task ID nor an image URL. Response: ${summarizePayload(created)}`);
    return { taskId: "synchronous", pollPath: submission.pollPath, immediate: { taskId: "synchronous", status: "success", imageUrl, raw: created } };
  }
  return { taskId, pollPath: submission.pollPath, immediate: null };
}

export async function pollCometTask(task: CometSubmission, options: { pollIntervalMs?: number; maxPolls?: number } = {}): Promise<CometTaskResult> {
  if (task.immediate) return task.immediate;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPolls = options.maxPolls ?? DEFAULT_MAX_POLLS;
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const result = await requestJson(task.pollPath(task.taskId), { method: "GET" });
    const status = findStatus(result);
    if (status === "success") return { taskId: task.taskId, status, imageUrl: findImageUrl(result), raw: result };
    if (status === "failure") throw new Error(`CometAPI task ${task.taskId} failed: ${JSON.stringify(result)}`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`CometAPI task ${task.taskId} did not finish within the polling window.`);
}

export async function generateCometRender(request: CometRenderRequest, options: { pollIntervalMs?: number; maxPolls?: number } = {}): Promise<CometTaskResult> {
  return pollCometTask(await submitCometTask(request), options);
}
