import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PWA_INJECTED, shippedPackages, thirdPartyLicensesTxt } from "./licenses.ts";

/** Writes files (path → content) into a fresh temp dir and returns it. */
function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "licenses-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const pkg = (name: string, extra: object = {}): string => JSON.stringify({ name, version: "1.0.0", license: "MIT", ...extra });

describe("shippedPackages", () => {
  it("follows app deps, nested deps and a pnpm workspace symlink; the workspace package itself is not listed", () => {
    const root = fixture({
      "app/package.json": pkg("app", { dependencies: { a: "^1", core: "workspace:^" } }),
      "app/node_modules/a/package.json": pkg("a", { dependencies: { b: "^1" } }),
      "app/node_modules/a/LICENSE": "MIT License\n\nCopyright (c) 2026 A",
      "node_modules/b/package.json": pkg("b", { license: "Apache-2.0" }),
      "node_modules/b/LICENSE": "Apache License",
      "node_modules/b/NOTICE": "B notice",
      "packages/core/package.json": pkg("core", { dependencies: { c: "^1" } }),
      "packages/core/node_modules/c/package.json": pkg("c"),
      "packages/core/node_modules/c/LICENSE": "ISC",
    });
    symlinkSync(join(root, "packages", "core"), join(root, "app", "node_modules", "core"));
    const result = shippedPackages(join(root, "app"));
    expect(result.packages.map((p) => p.name)).toEqual(["a", "b", "c"]);
    expect(result.packages.find((p) => p.name === "b")?.noticeText).toBe("B notice");
    expect(result.missing).toEqual([]);
    expect(result.withoutLicense).toEqual([]);
  });

  it("reports packages that are not installed and packages without a licence file (a LICENSE directory doesn't count)", () => {
    const root = fixture({
      "app/package.json": pkg("app", { dependencies: { a: "^1", gone: "^1" } }),
      "app/node_modules/a/package.json": pkg("a"),
      "app/node_modules/a/LICENSE/readme.txt": "a directory, not a licence file",
    });
    const result = shippedPackages(join(root, "app"));
    expect(result.missing).toEqual(["gone"]);
    expect(result.withoutLicense).toEqual(["a"]);
  });

  it("adds the Workbox packages vite-plugin-pwa injects, found through workbox-build", () => {
    const files: Record<string, string> = {
      "app/package.json": pkg("app", { devDependencies: { "vite-plugin-pwa": "^2" } }),
      "app/node_modules/vite-plugin-pwa/package.json": pkg("vite-plugin-pwa"),
      "app/node_modules/vite-plugin-pwa/node_modules/workbox-build/package.json": pkg("workbox-build"),
    };
    for (const name of PWA_INJECTED) {
      const at = name === "workbox-window" ? "app/node_modules" : "app/node_modules/vite-plugin-pwa/node_modules/workbox-build/node_modules";
      files[`${at}/${name}/package.json`] = pkg(name);
      files[`${at}/${name}/LICENSE`] = "MIT";
    }
    const result = shippedPackages(join(fixture(files), "app"));
    expect(result.packages.map((p) => p.name)).toEqual([...PWA_INJECTED].sort((a, b) => a.localeCompare(b, "en")));
    expect(result.missing).toEqual([]);
  });
});

describe("thirdPartyLicensesTxt", () => {
  it("includes the full licence text, NOTICE and a fallback line for packages without a licence file", () => {
    const txt = thirdPartyLicensesTxt("Demo", [
      { name: "a", version: "1.0.0", license: "MIT", url: "https://a.example", licenseText: "Copyright (c) 2026 A", noticeText: undefined },
      { name: "b", version: "2.0.0", license: "Apache-2.0", url: "https://b.example", licenseText: "Apache License", noticeText: "B notice" },
      { name: "c", version: "3.0.0", license: "ISC", url: "https://c.example", licenseText: undefined, noticeText: undefined },
    ]);
    expect(txt).toContain("a 1.0.0 — MIT");
    expect(txt).toContain("Copyright (c) 2026 A");
    expect(txt).toContain("NOTICE (b)\n\nB notice");
    expect(txt).toContain("No licence file is included in this package — see https://c.example.");
  });
});
