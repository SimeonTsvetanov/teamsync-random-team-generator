// Plain-text form of a result (Copy, Share, MCP) in the original TeamSync format.
// Used by the app (teams/result-actions.ts) and the MCP tool.

/** Labels the app passes in its UI language (EN/BG); the structure is the original TeamSync format. */
export interface FormatLabels {
  readonly heading: string; // "✨ TEAMS GENERATED ✨"
  readonly team: (n: number, members: number) => string; // "🏆 Team 1 | Members - 5"
  readonly attribution: string; // "— Made with TeamSync · https://…"
}

/** Returns the English labels (MCP and tests); `url` is the app address in the attribution. */
export function englishLabels(url: string): FormatLabels {
  return {
    heading: "✨ TEAMS GENERATED ✨",
    team: (n, members) => `🏆 Team ${String(n)} | Members - ${String(members)}`,
    attribution: `— Made with TeamSync · ${url}`,
  };
}

/** Plain text for Copy / Share / MCP: heading, one block per team, attribution last. */
export function formatTeams(teams: readonly (readonly string[])[], labels: FormatLabels): string {
  const blocks = teams.map((members, index) => [labels.team(index + 1, members.length), ...members.map((member) => `  👤 ${member}`)].join("\n"));
  return [labels.heading, ...blocks, labels.attribution].join("\n\n");
}
