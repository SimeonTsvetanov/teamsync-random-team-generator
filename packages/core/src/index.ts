/**
 * @simeonts/teamsync-random-team-generator-core — TeamSync's pure logic. No DOM, no I/O.
 * Used by the app and the MCP server (docs/PLAN.md §1).
 */
export type { Result } from "./result.js";
export { FOLLOWERS, FOLLOWERS_CHEAT, MAX_NAMES, MAX_NAME_LENGTH, expandFollowers, isFollowersLine, namesFromSharedText, parseNames, type NamesErrorCode } from "./names.js";
export { MAX_TEAMS, MIN_TEAMS, TeamsInput, cryptoRandomInt, makeTeams, shuffle, type RandomInt, type TeamsErrorCode } from "./teams.js";
export { englishLabels, formatTeams, type FormatLabels } from "./format.js";
