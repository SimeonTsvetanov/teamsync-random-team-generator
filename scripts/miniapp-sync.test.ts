// The Teams package keeps a few values of app.config.ts because it never imports the repo's config
// (Quizzard bundles it alone): they must stay equal (PLAN TS-01).
import { describe, expect, it } from "vitest";
import { help } from "@simeonts/teamsync-random-team-generator-miniapp/help";
import { STANDALONE_URL, meta } from "@simeonts/teamsync-random-team-generator-miniapp/meta";
import { app } from "../app.config.ts";

describe("mini-app package ↔ app.config.ts", () => {
  it("shares the site URL and the storage prefix", () => {
    expect(STANDALONE_URL).toBe(app.url);
    expect(meta.storage.prefix).toBe(`${app.id}:v1:`);
  });

  it("is where app.config's Help and FAQ come from", () => {
    expect(app.help).toEqual({ steps: help.en.steps, features: help.en.features });
    expect(app.faq).toBe(help.en.faq);
    expect(app.l10n.bg.faq).toBe(help.bg.faq);
  });
});
