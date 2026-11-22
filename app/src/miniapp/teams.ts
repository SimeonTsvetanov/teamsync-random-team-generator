// Mounts the Teams body (packages/miniapp) on the standalone page through the same contract Quizzard
// uses, and keeps what only this site does around it (Quizzard PLAN §1.5): the `?teams=` address,
// embed postMessage, Android share-target, the install offer and "Clear my data". Called by main.ts.
import teams from "@simeonts/teamsync-random-team-generator-miniapp";
import type { Unmount } from "@simeonts/teamsync-random-team-generator-miniapp/contract";
import { SHARED_TEXT_PARAM, TEAMS_PARAM, emitTeamsEvent, onTeamsEvent } from "@simeonts/teamsync-random-team-generator-miniapp/host-api";
import { meta } from "@simeonts/teamsync-random-team-generator-miniapp/meta";
import { registerPrefCheck } from "../storage/index.ts";
import { maybeOfferInstall } from "../ui/install.ts";
import { onShared } from "../ui/share-target.ts";
import { createStandaloneContext } from "./context.ts";
import { initEmbed, postToParent } from "./embed.ts";

/** Keeps `?teams=` in the address bar in step with the stepper (replaceState, no history spam). */
function writeTeamsToUrl(count: number): void {
  const query = new URLSearchParams(location.search);
  query.set(TEAMS_PARAM, String(count));
  history.replaceState(null, "", `${location.pathname}?${query.toString()}${location.hash}`);
}

/**
 * The body's launch parameters: the address bar's (`?teams=`) plus the text shared into the app.
 * `shared` never comes from the address, so no link can fill someone's list.
 */
function launchQuery(sharedText: string | null): URLSearchParams {
  const query = new URLSearchParams(location.search);
  query.delete(SHARED_TEXT_PARAM);
  if (sharedText) query.set(SHARED_TEXT_PARAM, sharedText);
  return query;
}

/** Runs `use` with the unmount, whether the module mounted at once or asynchronously. */
function whenMounted(result: Unmount | Promise<Unmount>, use: (unmount: Unmount) => void): void {
  if (typeof result === "function") use(result);
  else void result.then(use);
}

/** Embed mode and the install offer listen to the body's events on the mount element. */
function connectHost(element: HTMLElement): void {
  onTeamsEvent(element, "teams:count", ({ teams: count }) => { writeTeamsToUrl(count); });
  onTeamsEvent(element, "teams:error", ({ code }) => { postToParent("error", { code }); });
  onTeamsEvent(element, "teams:result", ({ teams: made }) => {
    postToParent("result", { teams: made });
    maybeOfferInstall();
  });
}

/**
 * Mounts the team screen over the page's static markup; does nothing on a page without it.
 * @remarks "Clear my data" (`app:data-cleared`) unmounts and mounts again, as Quizzard does: the
 * screen shows the empty list and the default number of teams, even when the address has `?teams=`.
 */
export function initTeamsScreen(): void {
  const element = document.querySelector<HTMLElement>("main");
  if (!element?.querySelector("[data-workspace]")) return;
  // Imported data must have the right types (a broken export can never break the app).
  registerPrefCheck("names", (value) => typeof value === "string" && value.length <= 110_000);
  registerPrefCheck("teams", (value) => Number.isInteger(value));
  let sharedText: string | null = null;
  onShared((content) => { sharedText = content.text || content.title; });
  connectHost(element);
  let unmount: Unmount | null = null;
  const mount = (query: URLSearchParams): void => {
    whenMounted(teams.mount(element, createStandaloneContext({ area: meta.storage, query })), (done) => { unmount = done; });
  };
  mount(launchQuery(sharedText));
  initEmbed((names, count) => { emitTeamsEvent(element, "teams:make", { names, teams: count }); });
  document.addEventListener("app:data-cleared", () => {
    unmount?.();
    unmount = null;
    const query = launchQuery(null);
    query.delete(TEAMS_PARAM);
    mount(query);
  });
}
