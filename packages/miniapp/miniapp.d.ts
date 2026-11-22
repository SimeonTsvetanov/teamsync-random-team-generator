// Type boundary of the mini-app (Quizzard PLAN §1.1 item 3): a consumer's `tsc` reads only this file
// and the contract, never the body's sources; Vite bundles `src/index.ts`.
import type { MiniAppModule } from "./src/contract.ts";

declare const teams: MiniAppModule;
export default teams;
