import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { appSlug } from "../src/index.js";

describe("appSlug", () => {
  it("makes a URL-safe slug", () => {
    expect(appSlug("  Hello, World! ")).toEqual({ ok: true, value: "hello-world" });
  });
  it("returns SLUG_EMPTY for text without letters or digits", () => {
    expect(appSlug("!!!")).toMatchObject({ ok: false, error: { code: "SLUG_EMPTY" } });
  });
  it("returns SLUG_TOO_LONG above 200 characters", () => {
    expect(appSlug("a".repeat(201))).toMatchObject({ ok: false, error: { code: "SLUG_TOO_LONG" } });
  });
  it("never throws and only outputs [a-z0-9-] (property)", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (s) => {
        const r = appSlug(s);
        return r.ok ? /^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.value) : r.error.code.length > 0;
      }),
    );
  });
});
