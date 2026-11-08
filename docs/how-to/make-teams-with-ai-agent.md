# Make teams with an AI agent

This guide shows you how to let an AI agent, such as Claude, make fair, random teams with TeamSync. TeamSync provides a local MCP (Model Context Protocol) server with one tool, `make_teams`.

## Prerequisites

- [Node.js](https://nodejs.org/) on your computer, so you can run `npx`.
- An AI client that supports local MCP servers, such as Claude Desktop or Claude Code.

## Add the MCP server

1. Open the MCP settings of your AI client.
2. Add a local (stdio) server with the following command:

   ```bash
   npx -y @simeonts/teamsync-random-team-generator-mcp
   ```

   In a client that uses a JSON configuration file, the entry looks like the following example:

   ```json
   {
     "mcpServers": {
       "teamsync": {
         "command": "npx",
         "args": ["-y", "@simeonts/teamsync-random-team-generator-mcp"]
       }
     }
   }
   ```

3. Restart your AI client.
4. Ask your agent to make teams, for example: "Split Maria, Liam, Aisha, Kenji, Elena and Diego into 3 teams."

The agent calls `make_teams` and shows the teams as ready-to-share text.

## The `make_teams` tool

The tool takes the following inputs:

| Input | Values | Meaning |
|---|---|---|
| `names` | A list of names, or text with one name per line | The people to split. Up to 1,000 names of up to 100 characters each. |
| `teams` | 2–10 | Number of teams. |

It returns the teams as data (`teams`: a list of teams, each a list of names) and as text in the same format as **Copy** in the app. Team sizes differ by at most one. If the input is invalid, the tool returns an error with a short message.

The server runs on your own computer. The names your agent sends to it aren't sent to TeamSync.

## Related

- [Agent docs (llms.txt)](https://simeontsvetanov.github.io/teamsync-random-team-generator/llms.txt)
- [Privacy and data](../about/privacy-and-data.md)
- [TeamSync user documentation](../index.md)
