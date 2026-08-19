import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.EVERCRAFTED_SMOKE_BASE_URL ?? "http://127.0.0.1:3000",
    storageState: process.env.EVERCRAFTED_SMOKE_STORAGE_STATE,
    trace: "retain-on-failure",
  },
});
