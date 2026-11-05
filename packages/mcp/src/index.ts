#!/usr/bin/env node
/**
 * Local MCP server for TeamSync (stdio). Tools mirror the core API with the same Zod schemas.
 * stdout is reserved for the protocol — log to stderr only.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { appSlug } from "@simeonts/teamsync-random-team-generator-core";

const server = new McpServer({ name: "teamsync-random-team-generator", version: "0.1.0" });

server.registerTool(
  "make_slug",
  {
    description: "Example tool: turn text into a URL-safe slug. Replace with the app's real tools.",
    inputSchema: z.object({ text: z.string().max(200) }),
  },
  ({ text }) => {
    const r = appSlug(text);
    return r.ok
      ? { content: [{ type: "text", text: r.value }] }
      : { content: [{ type: "text", text: JSON.stringify(r.error) }], isError: true };
  },
);

await server.connect(new StdioServerTransport());
