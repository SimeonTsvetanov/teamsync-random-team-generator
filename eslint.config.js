// ESLint 10 flat config — forge-engineering → typescript §4 and code-quality §9.
// Every code-quality rule a tool can check lives here, so reviews focus on judgement calls.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/** Files whose tool requires `export default` (code-quality §2). */
const TOOL_CONFIG_FILES = ["**/*.config.{js,ts,mjs,mts}", "**/pw.*.config.ts"];
/** Tests read best as long `describe` blocks; size limits apply to source only. */
const TEST_FILES = ["**/*.test.ts", "**/*.spec.ts", "tests/**"];

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
      // Types and imports
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "as", objectLiteralTypeAssertions: "never" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // Modules: named exports only (tool configs are exempt below)
      "no-restricted-syntax": ["error", { selector: "ExportDefaultDeclaration", message: "Use a named export (code-quality §2)." }],
      // Clarity
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "multi-line"],
      "no-nested-ternary": "error",
      "prefer-template": "error",
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      // Security §1: no HTML/code sinks (string timers: @typescript-eslint/no-implied-eval, in strict)
      "no-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-restricted-properties": [
        "error",
        ...["innerHTML", "outerHTML", "insertAdjacentHTML", "srcdoc"].map((property) => ({ property, message: "HTML sink — use textContent or h() (forge-engineering → security §1)." })),
        ...["write", "writeln"].map((property) => ({ object: "document", property, message: "HTML sink — use textContent or h() (forge-engineering → security §1)." })),
      ],
      // Naming (code-quality §1); object keys stay free for i18n keys, headers and JSON shapes
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "import", format: null },
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"] },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase", "UPPER_CASE"] },
        { selector: ["objectLiteralProperty", "typeProperty", "objectLiteralMethod"], format: null },
      ],
    },
  },
  { files: TOOL_CONFIG_FILES, rules: { "no-restricted-syntax": "off" } },
  { files: TEST_FILES, rules: { "max-lines-per-function": "off" } },
  { files: ["**/*.js", "**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  { files: ["**/*.js", "**/*.mjs"], rules: { "@typescript-eslint/explicit-module-boundary-types": "off", "@typescript-eslint/naming-convention": "off" } },
  { files: ["scripts/**", "packages/mcp/**"], rules: { "no-console": "off" } },
);
