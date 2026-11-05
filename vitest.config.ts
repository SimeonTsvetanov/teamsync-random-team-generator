import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.ts", "app/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**"],
      thresholds: { lines: 90 },
    },
  },
});
