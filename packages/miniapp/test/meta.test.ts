// The eager meta, Help and build preset a host reads without loading the body (contract v1).
import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION } from "../src/contract.ts";
import { help } from "../src/help.ts";
import { meta } from "../src/meta.ts";
import { vitePreset } from "../vite-preset.ts";

describe("meta", () => {
  it("is a valid contract v1 entry for the route #/teams", () => {
    expect(meta.contract).toBe(CONTRACT_VERSION);
    expect(meta.id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    expect(meta.status).toBe("ready");
    expect(meta.languages).toEqual(["en", "bg"]);
    for (const lang of meta.languages) {
      expect(meta.name[lang]?.trim()).toBeTruthy();
      expect(meta.tagline[lang]?.trim()).toBeTruthy();
    }
    expect(meta.icon).toMatch(/\.svg$/);
  });

  it("declares the standalone site's storage area and nothing else", () => {
    expect(meta.storage).toEqual({ prefix: "teamsync-random-team-generator:v1:" });
  });

  it("has a build preset for the same id, in shared CSS mode", () => {
    expect(vitePreset).toEqual({ id: meta.id, css: "shared", alias: {}, plugins: [] });
  });
});

describe("help", () => {
  it("has the same number of steps, features and questions in every language", () => {
    for (const part of ["steps", "features", "faq"] as const) {
      expect(help.bg[part]).toHaveLength(help.en[part].length);
      expect(help.en[part].length).toBeGreaterThan(0);
    }
  });
});
