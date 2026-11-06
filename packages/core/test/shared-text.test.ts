import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { namesFromSharedText } from "../src/index.js";

describe("namesFromSharedText (Share → TeamSync)", () => {
  it.each([
    ["numbered list", "1. Ana\n2) Boris\n3 - Vesko", "Ana\nBoris\nVesko"],
    ["bullets and dashes", "- Ana\n* Boris\n• Vesko\n– Gergana", "Ana\nBoris\nVesko\nGergana"],
    ["emoji markers", "⚽ Ana\n✅ Boris\n👍🏽 Vesko", "Ana\nBoris\nVesko"],
    ["checkboxes", "[x] Ana\n[ ] Boris", "Ana\nBoris"],
    ["WhatsApp copy (BG)", "[06.11.26, 18:03] Moni: Ana\n[06.11.26, 18:04] Moni: Boris", "Ana\nBoris"],
    ["WhatsApp copy (EN, AM/PM)", "11/6/26, 6:03 PM - Moni: Ana", "Ana"],
    ["one line with commas", "Ana, Boris; Vesko", "Ana\nBoris\nVesko"],
    ["blank lines and links", "Ana\n\nhttps://example.com\nBoris", "Ana\nBoris"],
    ["Cyrillic names stay", "1. Ана\n2. Борис Иванов", "Ана\nБорис Иванов"],
    ["the followers kept for later", "the followers", "the followers"],
  ])("%s", (_, input, expected) => {
    expect(namesFromSharedText(input)).toBe(expected);
  });
  it("a shared TeamSync result gives back only the names", () => {
    const shared = "✨ TEAMS GENERATED ✨\n\n🏆 Team 1 | Members - 2\n  👤 Ana\n  👤 Boris\n\n🏆 Team 2 | Members - 1\n  👤 Vesko\n\n— Made with TeamSync · https://x/";
    expect(namesFromSharedText(shared)).toBe("Ana\nBoris\nVesko");
  });
  it("names with commas on separate lines are not split", () => {
    expect(namesFromSharedText("Ana, coach\nBoris")).toBe("Ana, coach\nBoris");
  });
  it("never throws and never returns blank lines (property)", () => {
    fc.assert(fc.property(fc.string({ maxLength: 500 }), (s) => namesFromSharedText(s).split("\n").every((l) => l === "" || l.trim() === l)));
  });
});
