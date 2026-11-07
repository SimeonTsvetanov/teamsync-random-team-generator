# Security policy — TeamSync

## Supported versions
Only the latest release is supported: the live app at
https://simeontsvetanov.github.io/teamsync-random-team-generator/ and the latest npm versions of
`@simeonts/teamsync-random-team-generator-core` and `@simeonts/teamsync-random-team-generator-mcp`. Fixes ship as a new release.

## Reporting a vulnerability
Please report privately through GitHub:
https://github.com/SimeonTsvetanov/teamsync-random-team-generator/security/advisories/new

Do not open a public issue for security problems. Include what is affected, steps to reproduce
and the impact you expect.

## What to expect
- Acknowledgement within 7 days.
- An assessment (severity, CVSS v4 qualitative) and a plan within 14 days.
- Critical and High issues are fixed before any other release; you are credited in the advisory
  unless you prefer not to be.

## Scope
In scope: this repository's code — the web app, the core library, the local MCP server and the
GitHub Actions workflows. Out of scope: GitHub Pages and other third-party platforms themselves,
denial of service by volume, findings that need a compromised device or browser, and reports from
automated scanners without a demonstrated impact.
