/**
 * app.config.ts — the single source of truth for a micro-app (APP-STANDARD §0).
 * Menu, Help, legal pages, llms.txt, JSON-LD, manifest, sitemap, README service sections and the
 * n8n block are GENERATED from this object. Never duplicate these values elsewhere.
 * Scaffolded by forge-workflow. Fill __PLACEHOLDERS__ during /new-service.
 */

export interface UrlParam {
  readonly name: string; // e.g. "scale"
  readonly values: string; // human description of allowed values, e.g. "0.1–1.0"
  readonly default: string;
  readonly meaning: string;
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
  readonly version: string; // injected from package.json at build time
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
  readonly limits: { readonly maxFileMB?: number; readonly maxItems?: number }; // shown in Help, llms.txt, API
  readonly feedback: { readonly webhook: string | null }; // shared microapp-feedback n8n webhook
  readonly modes: {
    readonly urlParams: readonly UrlParam[];
    readonly postMessage: { readonly prefix: string } | null;
    readonly api: { readonly baseUrl: string; readonly openapi: string } | null;
    readonly mcp: { readonly url: string | null; readonly npm: string } | null;
    readonly n8n: { readonly workflow: string } | null;
    /** Receive text/links shared from other apps (Android "Share → app"); see ui/share-target.ts. */
    readonly shareTarget?: boolean;
  };
  readonly help: {
    readonly steps: readonly string[]; // Quick start, 3–5 steps with the exact UI labels
    readonly features: readonly { readonly name: string; readonly text: string }[]; // every option explained
  };
  readonly author: { readonly name: string; readonly country: string }; // Legal notice + About
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
  version: "0.1.0",
  languages: ["en", "bg"],
  accent: "#B4530F", // approved by Moni 2026-11-06: logo hue (#FFBF92) darkened to 5.02:1 with white text
  categories: ["utilities", "productivity"],
  contact: { email: "tsvetanov.simeon@gmail.com" },
  support: { buyMeACoffee: "https://buymeacoffee.com/simeontsvetanov" },
  ai: { builtWithAI: true, usesAIFeatures: false },
  title: { rotate: true },
  ads: { enabled: false },
  analytics: { umami: false },
  storage: { tiers: ["prefs"], stores: ["theme", "dismissed prompts"] },
  limits: {},
  feedback: { webhook: null },
  modes: {
    urlParams: [],
    postMessage: { prefix: "teamsync" },
    api: null,
    mcp: { url: null, npm: "@simeonts/teamsync-random-team-generator-mcp" },
    n8n: null,
  },
  help: {
    steps: ["Open TeamSync.", "Use the main action.", "Copy, share or download the result."],
    features: [],
  },
  l10n: {
    bg: {
      tagline: "Честни, случайни отбори за секунди",
      description: "Разделете всеки списък с имена на честни, случайни отбори за секунди. Безплатно, поверително и работи без интернет — всичко се изпълнява в браузъра.",
      help: {
        steps: ["Отворете TeamSync.", "Използвайте основното действие.", "Копирайте, споделете или изтеглете резултата."],
        features: [],
      },
      faq: [
        { q: "Безплатен ли е TeamSync?", a: "Да. Безплатен е, с отворен код (MIT) и работи в браузъра." },
        { q: "Напускат ли файловете ми устройството?", a: "Не. В браузъра всичко се обработва на Вашето устройство." },
      ],
    },
  },
  author: { name: "Simeon Tsvetanov", country: "Bulgaria" },
  faq: [
    { q: "Is TeamSync free?", a: "Yes. It is free and open source (MIT) and runs in your browser." },
    { q: "Do my files leave my device?", a: "No. In the browser everything is processed on your device." },
  ],
} as const satisfies AppConfig;
