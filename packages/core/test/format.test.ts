import { describe, expect, it } from "vitest";
import { englishLabels, formatTeams, type FormatLabels } from "../src/index.js";

const url = "https://simeontsvetanov.github.io/teamsync-random-team-generator/";

describe("formatTeams", () => {
  it("keeps the original TeamSync text format, attribution last (EN)", () => {
    expect(formatTeams([["Ana", "Boris"], ["Vesko"]], englishLabels(url))).toBe(
      ["✨ TEAMS GENERATED ✨", "🏆 Team 1 | Members - 2\n  👤 Ana\n  👤 Boris", "🏆 Team 2 | Members - 1\n  👤 Vesko", `— Made with TeamSync · ${url}`].join("\n\n"),
    );
  });
  it("uses the labels it is given (BG)", () => {
    const bg: FormatLabels = { heading: "✨ ОТБОРИТЕ СА ГОТОВИ ✨", team: (n, m) => `🏆 Отбор ${String(n)} | Членове - ${String(m)}`, attribution: `— Направено с TeamSync · ${url}` };
    const text = formatTeams([["Ана"], ["Борис"]], bg);
    expect(text.startsWith("✨ ОТБОРИТЕ СА ГОТОВИ ✨")).toBe(true);
    expect(text).toContain("🏆 Отбор 2 | Членове - 1\n  👤 Борис");
    expect(text.endsWith(`— Направено с TeamSync · ${url}`)).toBe(true);
  });
});
