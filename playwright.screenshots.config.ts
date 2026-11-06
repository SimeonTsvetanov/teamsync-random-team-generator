import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config.ts";

// Only for `pnpm screenshots` (not part of the e2e suite).
export default defineConfig({ ...base, testDir: "tests/screenshots", projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }] });
