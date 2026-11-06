// `pnpm docs:check` — offline checks for the user docs (forge-engineering → user-docs §7).
// Fails on broken relative links/images, bad alt text, missing light/dark twins, orphan images
// and pages without exactly one H1; warns on wording the style rules ban. Part of `pnpm verify`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS = join(ROOT, "docs");
const IMAGES = join(DOCS, "images");
/** User-doc pages; developer docs in the docs/ root (SPEC, PLAN, DECISIONS, …) are not checked. */
const USER_PAGES = ["index.md", "getting-started.md", "how-to", "reference", "about"];
const MAX_ALT_LENGTH = 150;
/** Style-guide words that date a page or talk down to the reader (user-docs §5). */
const BANNED_WORDS = /\b(simply|just|easy|easily|please|now|new|currently|soon|latest|click here|above|below)\b/gi;

interface Problem {
  readonly file: string;
  readonly message: string;
}

/** Lists every file under `dir` (recursively); empty when the folder does not exist. */
function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  if (statSync(dir).isFile()) return [dir];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => listFiles(join(dir, entry.name)));
}

/** Returns the user-doc Markdown pages plus README.md. */
function userPages(): string[] {
  const pages = USER_PAGES.flatMap((name) => listFiles(join(DOCS, name))).filter((file) => file.endsWith(".md"));
  return [join(ROOT, "README.md"), ...pages].filter((file) => existsSync(file));
}

/** Finds Markdown `![alt](src)` and HTML `<img … alt="…" src="…">` / `srcset="…"` images. */
function imagesIn(markdown: string): { alt: string | undefined; src: string }[] {
  const markdownImages = [...markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)].map((m) => ({ alt: m[1], src: m[2] ?? "" }));
  const htmlImages = [...markdown.matchAll(/<img\b[^>]*>/g)].map((m) => ({
    alt: /\balt="([^"]*)"/.exec(m[0])?.[1],
    src: /\bsrc="([^"]+)"/.exec(m[0])?.[1] ?? "",
  }));
  const sources = [...markdown.matchAll(/<source\b[^>]*srcset="([^"]+)"/g)].map((m) => ({ alt: "(source)", src: m[1] ?? "" }));
  return [...markdownImages, ...htmlImages, ...sources];
}

/** Checks one alt text against the [GS]/[MS] rules; returns the problem or undefined. */
function altProblem(alt: string | undefined, src: string): string | undefined {
  if (alt === "(source)") return undefined; // <source> has no alt; its <img> carries it
  if (alt === undefined || alt.trim() === "") return `image without alt text: ${src}`;
  if (alt.length > MAX_ALT_LENGTH) return `alt text longer than ${String(MAX_ALT_LENGTH)} characters: ${src}`;
  if (/^(image|picture)\b/i.test(alt)) return `alt text starts with "Image"/"Picture": ${src}`;
  if (src.endsWith(alt) || alt.endsWith(".png")) return `alt text is the file name: ${src}`;
  return undefined;
}

/** Checks one page; returns its problems and the absolute paths of the images it uses. */
function checkPage(file: string, warnings: Problem[]): { problems: Problem[]; used: string[] } {
  const name = relative(ROOT, file);
  const markdown = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, ""); // code samples are not links
  const problems: Problem[] = [];
  const used: string[] = [];
  const headingCount = (markdown.match(/^# /gm) ?? []).length;
  if (headingCount !== 1) problems.push({ file: name, message: `needs exactly one H1, found ${String(headingCount)}` });
  for (const { alt, src } of imagesIn(markdown)) {
    const message = altProblem(alt, src);
    if (message) problems.push({ file: name, message });
    if (!/^https?:/.test(src)) used.push(resolve(dirname(file), src));
  }
  const links = [...markdown.matchAll(/(?<!!\[[^\]]*)\]\(([^)\s#]+)(?:#[^)]*)?\)/g)].map((m) => m[1] ?? "").filter((href) => !/^(https?:|mailto:)/.test(href));
  for (const target of [...links, ...used.map((path) => relative(dirname(file), path))]) {
    if (!existsSync(resolve(dirname(file), target))) problems.push({ file: name, message: `broken link or image: ${target}` });
  }
  for (const match of markdown.matchAll(BANNED_WORDS)) warnings.push({ file: name, message: `avoid "${match[0]}" (user-docs §5)` });
  return { problems, used };
}

/** Every docs image needs its light/dark twin and at least one page that uses it. */
function checkImages(used: ReadonlySet<string>): Problem[] {
  return listFiles(IMAGES)
    .filter((file) => file.endsWith(".png"))
    .flatMap((file) => {
      const name = relative(ROOT, file);
      const twin = file.endsWith("-light.png") ? file.replace(/-light\.png$/, "-dark.png") : file.replace(/-dark\.png$/, "-light.png");
      const problems: Problem[] = [];
      if (twin === file) problems.push({ file: name, message: "image name must end in -light.png or -dark.png" });
      else if (!existsSync(twin)) problems.push({ file: name, message: `missing theme twin ${relative(ROOT, twin)}` });
      if (!used.has(file)) problems.push({ file: name, message: "orphan image (no page uses it)" });
      return problems;
    });
}

const warnings: Problem[] = [];
const results = userPages().map((file) => checkPage(file, warnings));
const problems = [...results.flatMap((r) => r.problems), ...checkImages(new Set(results.flatMap((r) => r.used)))];
for (const w of warnings) console.warn(`warn  ${w.file}: ${w.message}`);
for (const p of problems) console.error(`error ${p.file}: ${p.message}`);
console.log(`docs:check — ${String(results.length)} pages, ${String(problems.length)} errors, ${String(warnings.length)} warnings`);
if (problems.length > 0) process.exitCode = 1;
