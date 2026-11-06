/** Labels the app passes in its UI language (EN/BG); the structure is the original TeamSync format. */
export interface FormatLabels {
  readonly heading: string; // "✨ TEAMS GENERATED ✨"
  readonly team: (n: number, members: number) => string; // "🏆 Team 1 | Members - 5"
  readonly attribution: string; // "— Made with TeamSync · https://…"
}

export const englishLabels = (url: string): FormatLabels => ({
  heading: "✨ TEAMS GENERATED ✨",
  team: (n, members) => `🏆 Team ${String(n)} | Members - ${String(members)}`,
  attribution: `— Made with TeamSync · ${url}`,
});

/** Plain text for Copy / Share / MCP: heading, one block per team, attribution last. */
export function formatTeams(teams: readonly (readonly string[])[], labels: FormatLabels): string {
  const blocks = teams.map((members, i) => [labels.team(i + 1, members.length), ...members.map((m) => `  👤 ${m}`)].join("\n"));
  return [labels.heading, ...blocks, labels.attribution].join("\n\n");
}
