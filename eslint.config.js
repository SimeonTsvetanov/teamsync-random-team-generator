// ESLint 10 flat config — forge-engineering → typescript §4.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["**/*.d.ts", "**/dist/**", "**/.tsbuild/**", "app/public/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { project: ["./tsconfig.eslint.json"], tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
  { files: ["scripts/**", "packages/mcp/**"], rules: { "no-console": "off" } },
);
