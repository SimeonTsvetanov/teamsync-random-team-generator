// English texts of the Teams screen — the source of every key; bg.ts must match it (i18n.test.ts).
// Plurals: `key_one` / `key_other` (Intl.PluralRules). Copied from the standalone app's `app` and
// `shell.undo|undone` strings at the TS-01 split, so the standalone site reads exactly as before.

/** Every text the body shows, in English. */
export const en = {
  namesLabel: "Names",
  namesPlaceholder: "One name per line…",
  namesHint: "One name per line. Blank lines are ignored.",
  namesCount_one: "{{count}} name",
  namesCount_other: "{{count}} names",
  clear: "Clear",
  cleared: "Names list cleared",
  sharedIn_one: "{{count}} name added from the shared text",
  sharedIn_other: "{{count}} names added from the shared text",
  teamsLabel: "Teams",
  fewerTeams: "Fewer teams",
  moreTeams: "More teams",
  generate: "Generate teams",
  yourTeams: "Your teams",
  teamTitle: "Team {{n}}",
  membersCount_one: "{{count}} member",
  membersCount_other: "{{count}} members",
  ready_one: "{{count}} team is ready",
  ready_other: "{{count}} teams are ready",
  regenerate: "Shuffle again",
  startOver: "Clear and start over",
  startOverTitle: "Clear the names and teams?",
  startOverMessage: "The list and the teams will be removed from this device. You will start with an empty list.",
  startOverConfirm: "Clear",
  copy: "Copy",
  share: "Share",
  shareTitle: "Share the teams",
  editNames: "‹ Names",
  copied: "Teams copied ✓",
  copyFailed: "Couldn't copy — select the teams and copy them by hand.",
  copyHeading: "✨ TEAMS GENERATED ✨",
  copyTeam: "🏆 Team {{n}} | Members - {{members}}",
  attribution: "— Made with {{name}} · {{url}}",
  error: {
    NAMES_EMPTY: "Add at least two names, one per line.",
    NAMES_TOO_MANY: "That's more than 1,000 names — split the list into smaller groups.",
    NAME_TOO_LONG: "A name can have at most 100 characters.",
    NAMES_INVALID: "Names can have at most 100 characters each.",
    TEAMS_OUT_OF_RANGE: "Choose between 2 and 10 teams.",
    TEAMS_MORE_THAN_NAMES: "You have {{names}} names — add more names or choose fewer than {{teams}} teams.",
  },
  undo: "Undo",
  undone: "Undone ✓",
} as const;

/** Deep "string" version of a dictionary — the type every other language satisfies. */
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** A dictionary of the body: the English keys, any text. */
export type Messages = Widen<typeof en>;
