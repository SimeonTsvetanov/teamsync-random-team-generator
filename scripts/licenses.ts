/**
 * Third-party licence texts for the shipped web app (forge-app-shell → legal-pages §5): MIT, Apache-2.0
 * §4 and OFL need the full licence (+ NOTICE) with every copy. Used by scripts/generate.ts to write
 * app/public/third-party-licenses.txt, which About → Credits links to.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";

/** One package whose code or files end up in the app bundle. */
export interface ShippedPackage {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly url: string;
  readonly licenseText: string | undefined;
  readonly noticeText: string | undefined;
}

/** The shipped packages plus what could not be read: not installed, or no licence file inside. */
export interface ShippedPackages {
  readonly packages: readonly ShippedPackage[];
  readonly missing: readonly string[];
  readonly withoutLicense: readonly string[];
}

interface PackageJson {
  readonly name?: string;
  readonly version?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

/**
 * Packages the build injects although they are not `dependencies`: vite-plugin-pwa bundles
 * workbox-window (`virtual:pwa-register`) and generates sw.js with these Workbox runtime modules.
 * Add a module here when the Workbox config uses more (e.g. `workbox-expiration` for
 * runtimeCaching); compliance-check.mjs reads the real set from the `workbox:<module>:` markers in dist.
 */
export const PWA_INJECTED = ["workbox-window", "workbox-core", "workbox-precaching", "workbox-routing", "workbox-strategies"] as const;

const LICENSE_FILE = /^(licen[sc]e|copying)([-.][\w.-]+)?$/i;
const NOTICE_FILE = /^notice(\.(md|txt))?$/i;
const RULE = "=".repeat(72);

function readJson(path: string): PackageJson | undefined {
  try {
    // because package.json is trusted local build input; only the fields above are read
    return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
  } catch {
    return undefined; // missing or broken package.json → the package is reported as missing
  }
}

/** Returns the text of the first regular file in `dir` whose name matches `pattern`, if any. */
function readMatchingFile(dir: string, pattern: RegExp): string | undefined {
  const name = readdirSync(dir).sort().find((f) => pattern.test(f) && statSync(join(dir, f)).isFile());
  return name ? readFileSync(join(dir, name), "utf8").trim() : undefined;
}

/** Finds an installed package the way Node does: `node_modules/<name>` in `from` or a parent. */
function findPackageDir(from: string, name: string): string | undefined {
  let dir = from;
  for (;;) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return realpathSync(candidate);
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** Finds a build-injected package: next to the app, else among vite-plugin-pwa's / workbox-build's dependencies. */
function findInjectedDir(appDir: string, name: string): string | undefined {
  const pwa = findPackageDir(appDir, "vite-plugin-pwa");
  const build = pwa ? findPackageDir(pwa, "workbox-build") : undefined;
  return findPackageDir(appDir, name) ?? (pwa ? findPackageDir(pwa, name) : undefined) ?? (build ? findPackageDir(build, name) : undefined);
}

function toShipped(dir: string, pkg: PackageJson & { name: string }): ShippedPackage {
  return {
    name: pkg.name, version: pkg.version ?? "", license: pkg.license ?? "UNKNOWN",
    url: pkg.homepage ?? `https://www.npmjs.com/package/${pkg.name}`,
    licenseText: readMatchingFile(dir, LICENSE_FILE), noticeText: readMatchingFile(dir, NOTICE_FILE),
  };
}

/**
 * Returns every production package shipped by the package in `appDir`: its `dependencies`, their
 * dependencies, the dependencies of workspace packages (which are themselves not listed) and, when
 * the app uses vite-plugin-pwa, the injected Workbox packages. Sorted by name.
 */
export function shippedPackages(appDir: string): ShippedPackages {
  const found = new Map<string, ShippedPackage>();
  const missing = new Set<string>();
  const visited = new Set<string>();
  const root = realpathSync(appDir);
  const appPkg = readJson(join(root, "package.json"));
  const injected = appPkg?.devDependencies?.["vite-plugin-pwa"] ? PWA_INJECTED : [];
  const queue: string[] = [root];
  for (const name of injected) {
    const dir = findInjectedDir(root, name);
    if (dir) queue.push(dir);
    else missing.add(name);
  }
  while (queue.length) {
    const dir = queue.shift() ?? "";
    if (visited.has(dir)) continue;
    visited.add(dir);
    const pkg = readJson(join(dir, "package.json"));
    const isWorkspace = !dir.split(sep).includes("node_modules");
    if (pkg?.name && !isWorkspace && !found.has(pkg.name)) found.set(pkg.name, toShipped(dir, { ...pkg, name: pkg.name }));
    for (const dep of Object.keys(pkg?.dependencies ?? {})) {
      if (dep.startsWith("@types/")) continue; // type declarations never reach the bundle
      const depDir = findPackageDir(dir, dep);
      if (depDir) queue.push(depDir);
      else missing.add(dep);
    }
  }
  const packages = [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { packages, missing: [...missing].sort(), withoutLicense: packages.filter((p) => !p.licenseText).map((p) => p.name) };
}

/** Returns the third-party-licenses.txt text: one block per package with its full licence and NOTICE. */
export function thirdPartyLicensesTxt(appName: string, packages: readonly ShippedPackage[]): string {
  const blocks = packages.map((p) => [
    RULE,
    `${p.name} ${p.version} — ${p.license}`,
    p.url,
    RULE,
    "",
    p.licenseText ?? `No licence file is included in this package — see ${p.url}.`,
    ...(p.noticeText ? ["", `NOTICE (${p.name})`, "", p.noticeText] : []),
    "",
  ].join("\n"));
  const intro = `Third-party licences — ${appName}\n\n${appName} includes the open-source packages and fonts below. Each keeps its own licence; the full texts follow.\n`;
  return `${intro}\n${blocks.join("\n")}`;
}
