import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config.ts";

// Only for `pnpm docs:images` (not part of the e2e suite) — forge-engineering → user-docs §6.
export default defineConfig({ ...base, testDir: "tests/docs", projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }] });
