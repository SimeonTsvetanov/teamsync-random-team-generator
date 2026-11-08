# TeamSync MCP server

Split a list of people into 2–10 fair, random teams from any MCP client (Claude, VS Code, Cursor
and others). Team sizes differ by at most one, and the shuffle uses the platform's crypto random
generator. The server runs locally over stdio, needs no network and stores nothing.

Web app: <https://simeontsvetanov.github.io/teamsync-random-team-generator/>

## Add it to your MCP client

Add the following server to your client's MCP configuration (Node.js 22 or later):

```json
{
  "mcpServers": {
    "teamsync-random-team-generator": {
      "command": "npx",
      "args": ["-y", "@simeonts/teamsync-random-team-generator-mcp"]
    }
  }
}
```

## Tool `make_teams`

| Argument | Type | Rules |
|---|---|---|
| `names` | string[] or string | Up to 1,000 names, each up to 100 characters. Text is read one name per line; numbers, bullets and chat prefixes are removed. |
| `teams` | integer | 2–10, and not more than the number of names. |

The result has the teams in `structuredContent.teams` (one array of names per team) and the same
teams as ready-to-paste text. Errors return `isError: true` with a `code`: `INPUT_INVALID`,
`NAMES_EMPTY`, `NAMES_TOO_MANY`, `NAME_TOO_LONG`, `NAMES_INVALID`, `TEAMS_OUT_OF_RANGE` or
`TEAMS_MORE_THAN_NAMES`.

## More

- [User guide: make teams with an AI agent](https://github.com/SimeonTsvetanov/teamsync-random-team-generator/blob/main/docs/how-to/make-teams-with-ai-agent.md)
- [Full API reference](https://github.com/SimeonTsvetanov/teamsync-random-team-generator/blob/main/docs/API.md)
- [Report a problem](https://github.com/SimeonTsvetanov/teamsync-random-team-generator/issues)

MIT licence.
