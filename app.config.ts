/**
 * app.config.ts — the single source of truth for a micro-app (APP-STANDARD §0).
 * Menu, Help, legal pages, llms.txt, JSON-LD, manifest, sitemap, README service sections and the
 * n8n block are GENERATED from this object. Never duplicate these values elsewhere.
 * Scaffolded by forge. Fill __PLACEHOLDERS__ during /new-app.
 */
import { help as teamsHelp } from "@simeonts/teamsync-random-team-generator-miniapp/help";

export interface UrlParam {
  readonly name: string; // e.g. "scale"
  readonly values: string; // human description of allowed values, e.g. "0.1–1.0"
  readonly default: string;
  readonly meaning: string;
  /** Set by the app or the OS, not for links people write (e.g. "share-target"); listed apart in llms-full.txt, hidden in Help. */
  readonly internal?: boolean;
}

/** One field of an MCP tool's input/output or of an embed message (documented in llms-full.txt and docs/API.md). */
export interface FieldDoc {
  readonly name: string; // "names"
  readonly type: string; // TypeScript-like: "string[] | string", "number (integer)"
  readonly required?: boolean; // default true
  readonly limits?: string; // "≤ 1,000 items, each ≤ 100 characters"
  readonly meaning: string;
}

/** One MCP tool, exactly as the server registers it (forge-engineering → mcp). */
export interface McpToolDoc {
  readonly name: string; // "make_teams"
  readonly description: string;
  readonly input: readonly FieldDoc[];
  readonly output: readonly FieldDoc[]; // fields of structuredContent
  readonly errors?: string; // how a failure looks + its stable codes
  readonly example: { readonly arguments: string; readonly result: string }; // JSON text
}

/** One embed message (without the prefix): a request the host page sends, or an event the app posts. */
export interface EmbedMessageDoc {
  readonly type: string; // "make" → "<prefix>:make"
  readonly meaning: string;
  readonly payload: readonly FieldDoc[]; // fields next to `type`; [] = none
}

/** Texts shown to users that also exist in another UI language (forge-app-shell → i18n §3). */
export interface AppText {
  readonly tagline: string;
  readonly description: string;
  readonly help: AppConfig["help"];
  readonly faq: AppConfig["faq"];
}

export interface AppConfig {
  readonly id: string; // kebab-case, = repo name, = storage namespace
  readonly name: string; // "PDF → PNG"
  readonly shortName?: string; // Home Screen label, ≤ 12 chars
  readonly tagline: string; // ≤ 60 chars incl. name in <title> "{name} — {tagline}"
  readonly description: string; // 1–2 sentences, ≤ 155 chars for <meta description>
  readonly url: string; // https://simeontsvetanov.github.io/<id>/
  readonly repo: string; // https://github.com/SimeonTsvetanov/<id>
  readonly version: string; // = root package.json "version" (generate.ts fails on a mismatch); build injects it into HTML + JSON-LD
  readonly languages: readonly ("en" | "bg")[]; // English first and default; /new-service asks
  /** One entry per extra language in `languages`, same number of steps/features/FAQ (generate.ts checks). */
  readonly l10n?: { readonly bg?: AppText };
  readonly accent?: string; // hex; must pass forge-design color.mjs check
  readonly categories: readonly string[]; // manifest categories, e.g. ["utilities"]
  readonly contact: { readonly email: string }; // ask Moni every time — never guess
  readonly support: { readonly buyMeACoffee: string; readonly githubSponsors?: string; readonly kofi?: string };
  readonly ai: { readonly builtWithAI: boolean; readonly usesAIFeatures: boolean; readonly provider?: string; readonly model?: string };
  readonly title: { readonly rotate: boolean }; // tab title rotation (forge-growth)
  readonly ads: { readonly enabled: boolean }; // only with a recorded decision
  readonly analytics: { readonly umami: boolean }; // off by default
  readonly storage: { readonly tiers: readonly ("prefs" | "indexeddb" | "opfs")[]; readonly stores: readonly string[] }; // what is saved — feeds Terms/Privacy
  /** Shown in Help, llms.txt, API. Set maxFileMB only for apps that take files: it also switches the privacy text to "files never leave the device". */
  readonly limits: { readonly maxFileMB?: number; readonly maxItems?: number };
  readonly feedback: { readonly webhook: string | null }; // shared microapp-feedback n8n webhook
  readonly modes: {
    readonly urlParams: readonly UrlParam[];
    /** iframe contract: every request and event with its payload (llms-full.txt, docs/API.md, Help). */
    readonly postMessage: { readonly prefix: string; readonly requests: readonly EmbedMessageDoc[]; readonly events: readonly EmbedMessageDoc[] } | null;
    readonly api: { readonly baseUrl: string; readonly openapi: string } | null;
    /** `tools` = what the server registers, documented exactly in llms.txt/llms-full.txt (generate warns when empty). */
    readonly mcp: { readonly url: string | null; readonly npm: string; readonly tools: readonly McpToolDoc[] } | null;
    readonly n8n: { readonly workflow: string } | null;
    /** Receive text/links shared from other apps (Android "Share → app"); see ui/share-target.ts. */
    readonly shareTarget?: boolean;
  };
  readonly help: {
    readonly steps: readonly string[]; // Quick start, 3–5 steps with the exact UI labels
    readonly features: readonly { readonly name: string; readonly text: string }[]; // every option explained
  };
  /** "More free tools" link (footer, 404). Until the hub site simeontsvetanov.github.io exists: the GitHub list. */
  readonly moreTools: string;
  readonly author: { readonly name: string; readonly country: string; readonly linkedin?: string; readonly github?: string }; // Legal notice, About, Support, JSON-LD
  /** `wasm: true` adds 'wasm-unsafe-eval' to script-src — only when the build ships .wasm (forge-engineering → security §1). */
  readonly csp?: { readonly wasm?: boolean };
  readonly seo?: { readonly googleVerification?: string }; // Search Console meta token (forge-growth → seo-geo §3); omit when unused
  readonly faq: readonly { readonly q: string; readonly a: string }[]; // 5–10, also FAQPage JSON-LD
  readonly shortcuts?: readonly { readonly name: string; readonly url: string }[];
}

export const app = {
  id: "teamsync-random-team-generator",
  name: "TeamSync",
  tagline: "Create fair, random teams in seconds",
  description: "Split any list of names into fair, random teams in seconds. Free, private and works offline — everything runs in your browser.",
  url: "https://simeontsvetanov.github.io/teamsync-random-team-generator/",
  repo: "https://github.com/SimeonTsvetanov/teamsync-random-team-generator",
  version: "1.0.3",
  languages: ["en", "bg"],
  accent: "#3DDC97", // Moni 2026-11-06: fresh mint green; dark text on it (9.5:1), chosen automatically by generate.ts
  categories: ["utilities", "productivity", "sports", "education"],
  contact: { email: "tsvetanov.simeon@gmail.com" },
  support: { buyMeACoffee: "https://buymeacoffee.com/simeontsvetanov" },
  ai: { builtWithAI: true, usesAIFeatures: false },
  title: { rotate: true },
  ads: { enabled: false },
  analytics: { umami: false },
  storage: { tiers: ["prefs"], stores: ["theme", "language", "last names list", "number of teams", "dismissed prompts", "report draft"] },
  limits: { maxItems: 1000 },
  feedback: { webhook: null },
  modes: {
    urlParams: [
      { name: "teams", values: "2–10", default: "2", meaning: "Number of teams to make (names are never put in the link)" },
      { name: "lang", values: "en | bg", default: "en", meaning: "Interface language for this visit (without it: your saved choice, else English); it is not saved" },
      { name: "share-target", values: "1 (+ title, text, url)", default: "-", meaning: "Android “Share → TeamSync”: the shared text becomes the names list; the parameters are removed from the address bar right away", internal: true },
    ],
    postMessage: {
      prefix: "teamsync",
      requests: [{
        type: "make", meaning: "Make teams from these names (the names box shows them, then the result is posted back).",
        payload: [
          { name: "names", type: "string[]", limits: "≤ 1,000 names, each ≤ 100 characters; blank entries are ignored; whole message ≤ 120,000 characters", meaning: "The people to split." },
          { name: "teams", type: "number (integer)", limits: "2–10", meaning: "How many teams to make." },
        ],
      }],
      events: [
        { type: "ready", meaning: "TeamSync is loaded and listening for teamsync:make.", payload: [] },
        { type: "result", meaning: "The teams were made (after teamsync:make or a tap on Generate teams / Shuffle again).", payload: [{ name: "teams", type: "string[][]", meaning: "One array of names per team; sizes differ by at most one, bigger teams first." }] },
        { type: "error", meaning: "The teams could not be made.", payload: [{ name: "code", type: "string", meaning: "NAMES_EMPTY | NAMES_TOO_MANY | NAME_TOO_LONG | NAMES_INVALID | TEAMS_OUT_OF_RANGE | TEAMS_MORE_THAN_NAMES" }] },
      ],
    },
    api: null,
    mcp: {
      url: null,
      npm: "@simeonts/teamsync-random-team-generator-mcp",
      tools: [{
        name: "make_teams",
        description: "Split a list of people into 2–10 fair, random teams (sizes differ by at most 1; unbiased crypto shuffle). Read-only, no network.",
        input: [
          { name: "names", type: "string[] | string", limits: "array: ≤ 1,000 names, each ≤ 100 characters · text: ≤ 110,000 characters, one name per line; numbers, bullets and chat prefixes are removed", meaning: "People to split: an array of names, or text with one name per line." },
          { name: "teams", type: "number (integer)", limits: "2–10, not more than the number of names", meaning: "Number of teams." },
        ],
        output: [{ name: "teams", type: "string[][]", meaning: "One array of names per team (the text content has the same teams ready to paste into a chat)." }],
        errors: "isError: true with text content {\"code\",\"message\"}; codes INPUT_INVALID, NAMES_EMPTY, NAMES_TOO_MANY, NAME_TOO_LONG, NAMES_INVALID, TEAMS_OUT_OF_RANGE, TEAMS_MORE_THAN_NAMES.",
        example: { arguments: '{"names":["Maria","Liam","Aisha","Kenji","Elena"],"teams":2}', result: '{"teams":[["Kenji","Maria","Elena"],["Aisha","Liam"]]}' },
      }],
    },
    n8n: null,
    shareTarget: true, // Android: Share → TeamSync from WhatsApp/Viber/notes (Moni 2026-11-06)
  },
  // Help and FAQ texts live with the team screen (packages/miniapp/src/help.ts), which Quizzard shows too.
  help: { steps: teamsHelp.en.steps, features: teamsHelp.en.features },
  l10n: {
    bg: {
      tagline: "Честни, случайни отбори за секунди",
      description: "Разделете всеки списък с имена на честни, случайни отбори за секунди. Безплатно, поверително и работи без интернет — всичко се изпълнява в браузъра.",
      help: { steps: teamsHelp.bg.steps, features: teamsHelp.bg.features },
      faq: teamsHelp.bg.faq,
    },
  },
  moreTools: "https://github.com/SimeonTsvetanov?tab=repositories&q=simeonts-microapp",
  author: { name: "Simeon Tsvetanov", country: "Bulgaria", linkedin: "https://www.linkedin.com/in/simeon-tsvetanov-a00963159", github: "https://github.com/SimeonTsvetanov" },
  faq: teamsHelp.en.faq,
  shortcuts: [{ name: "Make 2 teams", url: "./?teams=2" }, { name: "Make 3 teams", url: "./?teams=3" }],
} as const satisfies AppConfig;
