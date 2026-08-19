import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

async function main() {
  const ctx = {
    user: { id: 1, openId: "7STrfCRgJjiRrQNpeVj95b", name: "Bret Baden", email: "thebadencompany@gmail.com", loginMethod: "google", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} },
    res: {},
  } as TrpcContext;
  const caller = appRouter.createCaller(ctx);
  const projectId = 90001;
  const queued = await caller.render.enqueueComet({ projectId, kind: "lifestyle", operation: "imagine", model: "mj-fast-imagine", mode: "FAST", parameters: "--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7", prompt: "A quiet editorial dining room at late afternoon, a single ivory wreath placed above the mantel, cinematic natural light, story-rich atmosphere, no text", sceneIndex: 0, sceneTitle: "The room remembers" });
  console.log(JSON.stringify({ queued }, null, 2));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const status = await caller.render.taskStatus({ taskId: queued.taskId });
    console.log(JSON.stringify({ attempt: attempt + 1, status }, null, 2));
    if (status?.status === "review_ready" || status?.status === "failed") {
      if (status.status === "review_ready") {
        const assets = await caller.render.reviewQueue({ projectId });
        console.log(JSON.stringify({ reviewAsset: assets.find((asset) => asset.id === status.renderAssetId) ?? null }, null, 2));
      }
      break;
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
