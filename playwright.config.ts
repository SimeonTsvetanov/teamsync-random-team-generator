import { defineConfig, devices } from "@playwright/test";

// e2e runs in CI (and locally with `pnpm e2e`) against `vite preview` with the real base path.
// tests/e2e holds both suites (PLAN TS-02), and `pnpm e2e` runs both: miniapp/ = the team screen's
// flows (Quizzard runs them too, behind `#/teams`; support/entry.ts), shell/ = the standalone page
// only. One suite alone: `pnpm e2e:miniapp` or `pnpm e2e:shell`.
// `E2E_BASE_URL` runs them against a deployed site (e.g. the live URL) without a preview server.
const DEPLOYED_URL = process.env["E2E_BASE_URL"];

export default defineConfig({
  testDir: "tests/e2e",
  // CI: no stray test.only, 2 retries + a trace of the first retry; `--fail-on-flaky-tests` turns a pass-on-retry red (testing §4).
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  use: { trace: "on-first-retry", baseURL: DEPLOYED_URL ?? "http://localhost:4173/teamsync-random-team-generator/" },
  ...(DEPLOYED_URL === undefined ? { webServer: { command: "pnpm -F app preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env["CI"] } } : {}),
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
});
