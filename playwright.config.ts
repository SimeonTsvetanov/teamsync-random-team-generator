import { defineConfig, devices } from "@playwright/test";

// e2e runs in CI (and locally with `pnpm e2e`) against `vite preview` with the real base path.
export default defineConfig({
  testDir: "tests/e2e",
  // CI: no stray test.only, 2 retries + a trace of the first retry; `--fail-on-flaky-tests` turns a pass-on-retry red (testing §4).
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  use: { trace: "on-first-retry", baseURL: "http://localhost:4173/teamsync-random-team-generator/" },
  webServer: { command: "pnpm -F app preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env["CI"] },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
});
