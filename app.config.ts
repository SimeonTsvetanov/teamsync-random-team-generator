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
    urlParams: [{ name: "teams", values: "2–10", default: "2", meaning: "Number of teams to make (names are never put in the link)" }],
    postMessage: { prefix: "teamsync" },
    api: null,
    mcp: { url: null, npm: "@simeonts/teamsync-random-team-generator-mcp" },
    n8n: null,
  },
  help: {
    steps: [
      "Type or paste the names, one per line.",
      "Choose how many teams with − and +.",
      "Tap “Generate teams”.",
      "Not happy? Tap “Shuffle again” — then Copy or Share the teams.",
    ],
    features: [
      { name: "Fair shuffle", text: "Every possible split is equally likely (Fisher–Yates with your device's secure random numbers). Team sizes differ by at most one, bigger teams first." },
      { name: "Remembers your list", text: "Your last names list and number of teams stay on this device, so a weekly game is one tap. Clear removes the list (with Undo); Settings → Clear my data removes everything." },
      { name: "Copy and Share", text: "Copy gives a ready-to-paste text for any chat; Share opens your phone's share sheet." },
      { name: "Link with the number of teams", text: "Links like ?teams=3 open TeamSync with 3 teams selected. Names are never part of a link." },
      { name: "Works offline", text: "After the first visit TeamSync works without internet; install it to open it like an app." },
    ],
  },
  l10n: {
    bg: {
      tagline: "Честни, случайни отбори за секунди",
      description: "Разделете всеки списък с имена на честни, случайни отбори за секунди. Безплатно, поверително и работи без интернет — всичко се изпълнява в браузъра.",
      help: {
        steps: [
          "Напишете или поставете имената, по едно на ред.",
          "Изберете броя на отборите с − и +.",
          "Натиснете „Направи отбори“.",
          "Не ви харесва разпределението? Натиснете „Разбъркай отново“ — после Копирай или Сподели.",
        ],
        features: [
          { name: "Честно разбъркване", text: "Всяко разпределение е еднакво вероятно (алгоритъм на Фишер–Йейтс със сигурните случайни числа на устройството). Отборите се различават с най-много един човек, по-големите са първи." },
          { name: "Помни списъка", text: "Последният списък с имена и броят отбори остават на това устройство, така че седмичният мач е на едно натискане. „Изчисти“ маха списъка (с възможност за отмяна); Настройки → Изтрий данните ми маха всичко." },
          { name: "Копиране и споделяне", text: "„Копирай“ дава готов текст за всеки чат; „Сподели“ отваря менюто за споделяне на телефона." },
          { name: "Линк с броя отбори", text: "Линк като ?teams=3 отваря TeamSync с избрани 3 отбора. Имената никога не са част от линк." },
          { name: "Работи без интернет", text: "След първото посещение TeamSync работи без интернет; инсталирайте го, за да се отваря като приложение." },
        ],
      },
      faq: [
        { q: "Безплатен ли е TeamSync?", a: "Да. Безплатен е, с отворен код (лиценз MIT), без реклами и без регистрация." },
        { q: "Наистина ли разпределението е честно?", a: "Да. Използва се алгоритъмът на Фишер–Йейтс със сигурните случайни числа на устройството, така че всяко разпределение е еднакво вероятно. Отборите се различават с най-много един човек." },
        { q: "Изпращат ли се имената някъде?", a: "Не. Всичко се изчислява в браузъра на Вашето устройство. Имената не се качват и не влизат в линкове." },
        { q: "Колко имена и отбори мога да имам?", a: "До 1000 имена и от 2 до 10 отбора. Едно име може да е до 100 знака; еднакви имена са позволени." },
        { q: "Работи ли без интернет?", a: "Да, след първото посещение. Можете и да го инсталирате на телефона или компютъра, за да се отваря като приложение." },
        { q: "Как да изпратя отборите в чата?", a: "Натиснете „Копирай“ и поставете текста в чата, или „Сподели“, за да изберете приложение направо." },
        { q: "Може ли AI агент да прави отбори с TeamSync?", a: "Да. Локалният MCP сървър (npx -y @simeonts/teamsync-random-team-generator-mcp) дава инструмента make_teams; документацията е в llms.txt." },
      ],
    },
  },
  author: { name: "Simeon Tsvetanov", country: "Bulgaria" },
  faq: [
    { q: "Is TeamSync free?", a: "Yes. It is free and open source (MIT licence), with no ads and no sign-up." },
    { q: "Are the teams really fair?", a: "Yes. TeamSync uses the Fisher–Yates shuffle with your device's secure random numbers, so every split is equally likely. Team sizes differ by at most one." },
    { q: "Are the names sent anywhere?", a: "No. Everything is computed in your browser on your device. Names are not uploaded and are never put in links." },
    { q: "How many names and teams can I use?", a: "Up to 1,000 names and 2 to 10 teams. A name can have up to 100 characters; duplicate names are allowed." },
    { q: "Does it work offline?", a: "Yes, after the first visit. You can also install it on your phone or computer to open it like an app." },
    { q: "How do I send the teams to my group chat?", a: "Tap Copy and paste the text into the chat, or tap Share to pick an app directly." },
    { q: "Can an AI agent make teams with TeamSync?", a: "Yes. The local MCP server (npx -y @simeonts/teamsync-random-team-generator-mcp) provides the make_teams tool; docs are in llms.txt." },
  ],
  shortcuts: [{ name: "Make 2 teams", url: "./?teams=2" }, { name: "Make 3 teams", url: "./?teams=3" }],
} as const satisfies AppConfig;
