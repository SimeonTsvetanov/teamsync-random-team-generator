#!/usr/bin/env node
/**
 * Local MCP server for TeamSync (stdio): tool `make_teams` — the same core as the app.
 * stdout is reserved for the protocol — log to stderr only.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod";
import { makeTeamsInput, makeTeamsTool } from "./tool.js";

const server = new McpServer({ name: "teamsync-random-team-generator", version: "1.0.1" });

server.registerTool(
  "make_teams",
  {
    title: "Make fair random teams",
    description:
      "Split a list of people into 2–10 fair, random teams (sizes differ by at most 1; unbiased crypto shuffle). Accepts an array of names or one-per-line text. Returns the teams as data and as ready-to-share text.",
    inputSchema: makeTeamsInput,
    outputSchema: z.object({ teams: z.array(z.array(z.string())) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  (args) => makeTeamsTool(args),
);

await server.connect(new StdioServerTransport());
