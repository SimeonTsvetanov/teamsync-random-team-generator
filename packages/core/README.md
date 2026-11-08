# TeamSync core

The logic behind [TeamSync](https://simeontsvetanov.github.io/teamsync-random-team-generator/):
read a list of names and split it into fair, random teams. Pure TypeScript with no DOM, used by
the web app and by the
[TeamSync MCP server](https://www.npmjs.com/package/@simeonts/teamsync-random-team-generator-mcp).

```ts
import { parseNames, makeTeams, formatTeams, englishLabels } from "@simeonts/teamsync-random-team-generator-core";

const names = parseNames("1. Ana\n2. Boris\n3. Chen\n4. Dana");
if (names.ok) {
  const teams = makeTeams({ names: names.value, teams: 2 });
  if (teams.ok) console.log(formatTeams(teams.value, englishLabels("https://example.com/")));
}
```

Functions return a `Result` (`{ ok: true, value }` or `{ ok: false, error: { code, message } }`) instead of throwing.
Team sizes differ by at most one; the default shuffle uses `crypto.getRandomValues`.

[Source and issues](https://github.com/SimeonTsvetanov/teamsync-random-team-generator) · MIT licence.
