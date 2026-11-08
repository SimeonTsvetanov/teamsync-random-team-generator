# URL parameters and embedding

This page describes the link parameters TeamSync reads and the messages it exchanges when another page embeds it.

## URL parameters

<!-- generated: do not edit — from app.config.ts modes.urlParams -->
| Name | Values | Default | Meaning |
|---|---|---|---|
| `teams` | 2–10 | 2 | Number of teams to make (names are never put in the link) |
| `lang` | en \| bg | en | Interface language for this visit (without it: your saved choice, else English); it is not saved |

Example: `https://simeontsvetanov.github.io/teamsync-random-team-generator/?teams=3` opens TeamSync with 3 teams selected. A value outside 2–10 is ignored. When you change **Teams**, TeamSync updates `?teams=` in the address bar, so you can bookmark or share the link.

## Embedding in an iframe

A page can show TeamSync in an `<iframe>` and talk to it with `postMessage`. TeamSync accepts messages only from the embedding page's own origin and sends messages only to that origin.

| Message | Direction | Content |
|---|---|---|
| `teamsync:ready` | TeamSync → page | TeamSync is loaded. |
| `teamsync:make` | page → TeamSync | `{ type, names: string[], teams: number }` — up to 1,000 names of up to 100 characters, 2–10 teams. |
| `teamsync:result` | TeamSync → page | `{ type, teams: string[][] }` — the teams. |
| `teamsync:error` | TeamSync → page | `{ type, code }` — the error code, for example `TEAMS_MORE_THAN_NAMES`. |

## Related

- [Settings and limits](settings.md)
- [Make teams with an AI agent](../how-to/make-teams-with-ai-agent.md)
- [TeamSync user documentation](../index.md)
