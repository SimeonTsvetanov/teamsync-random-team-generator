// The `make_teams` MCP tool: input schema and a pure handler (tested without a transport).
// Registered by index.ts.
import * as z from "zod";
import { MAX_TEAMS, MIN_TEAMS, englishLabels, formatTeams, makeTeams, parseNames } from "@simeonts/teamsync-random-team-generator-core";

/** The live app, named in the attribution line of every result. */
export const APP_URL = "https://simeontsvetanov.github.io/teamsync-random-team-generator/";

/** Input of `make_teams`: a list of names or one-per-line text (the "the followers" line works too). */
export const makeTeamsInput = z.object({
  names: z.union([z.array(z.string().max(100)).max(1000), z.string().max(110_000)])
    .describe("People to split: an array of names, or text with one name per line."),
  teams: z.int().min(MIN_TEAMS).max(MAX_TEAMS).describe(`Number of teams (${String(MIN_TEAMS)}–${String(MAX_TEAMS)}).`),
});

/** What `make_teams` returns: text for people, `structuredContent` for agents, `isError` on failure. */
export interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  structuredContent?: { teams: string[][] };
  isError?: boolean;
}

/** A failed call: the stable `code` and message as JSON text, so agents can branch on the code. */
function toolError(code: string, message: string): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ code, message }) }], isError: true };
}

/** Pure handler (tested without a transport): parse names → fair random teams → text + structured data. */
export function makeTeamsTool(args: z.input<typeof makeTeamsInput>): ToolResult {
  const input = makeTeamsInput.safeParse(args);
  if (!input.success) return toolError("INPUT_INVALID", "names must be an array of names or one-per-line text; teams 2–10.");
  const text = Array.isArray(input.data.names) ? input.data.names.join("\n") : input.data.names;
  const names = parseNames(text);
  if (!names.ok) return toolError(names.error.code, names.error.message);
  const teams = makeTeams({ names: names.value, teams: input.data.teams });
  if (!teams.ok) return toolError(teams.error.code, teams.error.message);
  return { content: [{ type: "text", text: formatTeams(teams.value, englishLabels(APP_URL)) }], structuredContent: { teams: teams.value } };
}
