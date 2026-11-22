// The Teams mini-app (contract `MiniAppModule`): the chunk Quizzard loads for `#/teams` and the body
// the standalone site mounts on its own page. Its CSS comes with it (shared mode, vite-preset.ts).
import "./styles/teams.css";
import type { MiniAppModule } from "./contract.ts";
import { mountTeams } from "./teams/mount.ts";

/** Mounts the team screen; no Settings rows of its own (the standalone Settings covers its data). */
const teams: MiniAppModule = { mount: mountTeams };

// The contract's `MiniAppEntry.load` reads the chunk's default export.
export default teams;
