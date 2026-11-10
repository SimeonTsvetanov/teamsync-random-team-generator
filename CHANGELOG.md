# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

## [1.0.2] - 2026-11-10
### Changed
- AI agents: the make_teams tool declares that it is read-only, safe to repeat and works offline, so agent apps can run it without extra warnings.

## [1.0.1] - 2026-11-08
### Fixed
- AI agents: names pasted as text (numbered lists, bullets, emoji, chat messages) are cleaned like in the app.

## [1.0.0] - 2026-11-08
### Added
- TeamSync is rebuilt from scratch as a fast app you can install, and it works offline.
- Fair teams: every split is equally likely, and team sizes differ by at most one.
- TeamSync remembers your last list and number of teams on this device.
- English and Bulgarian (Settings → Language).
- Send the teams to WhatsApp or any other app; Copy gives a ready text for any chat.
- Paste a list from a chat: numbers, bullets and emoji are removed automatically.
- On Android, share a list from WhatsApp straight into TeamSync (after you install it).
- Links like ?teams=3 open TeamSync with 3 teams selected.
- AI agents can make teams too, with the local MCP tool make_teams.

[Unreleased]: https://github.com/SimeonTsvetanov/teamsync-random-team-generator/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/SimeonTsvetanov/teamsync-random-team-generator/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/SimeonTsvetanov/teamsync-random-team-generator/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/SimeonTsvetanov/teamsync-random-team-generator/releases/tag/v1.0.0
