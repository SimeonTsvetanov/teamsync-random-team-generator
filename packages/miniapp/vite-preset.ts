// Build preset of the Teams mini-app for a host's Vite config (Quizzard PLAN §1.3, T-09/T-10).
// Data only: "shared" = Level 1 body that uses the host's forge components and adds its `teams-*` CSS.

/** What a host's build needs to know about this mini-app. */
export interface MiniAppVitePreset {
  /** = `meta.id`; scopes the CSS under `[data-miniapp="teams"]` in the host. */
  readonly id: "teams";
  /** "shared": no reset layer; the host's `.button`, `.field` … rules apply inside the body on purpose. */
  readonly css: "shared" | "isolated";
  /** Module aliases the body needs; none. */
  readonly alias: Readonly<Record<string, string>>;
  /** Extra Vite plugins the body needs; none (Vite's own `?raw` loads `screen.html`). */
  readonly plugins: readonly never[];
}

/** The Teams preset: shared CSS, no aliases, no plugins. */
export const vitePreset: MiniAppVitePreset = { id: "teams", css: "shared", alias: {}, plugins: [] };
