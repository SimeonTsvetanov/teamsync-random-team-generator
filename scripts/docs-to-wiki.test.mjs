// node --test scripts/docs-to-wiki.test.mjs
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { FOOTER, MARKER, mirror, wikiName } from "./docs-to-wiki.mjs";

/** Writes a small docs/ tree and returns { docs, wiki }. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "docs-to-wiki-"));
  const docs = join(root, "docs");
  const files = {
    "index.md": "# App docs\n\n## How-to guides\n\n- [Create teams](how-to/create-teams.md) — make teams.\n\n## About\n\n- [Privacy](about/privacy.md)\n",
    "how-to/create-teams.md": '# Create teams\n\nSee [privacy](../about/privacy.md#stored) and the [spec](../SPEC.md).\n\n<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="../images/create-teams/form-dark.png">\n  <img src="../images/create-teams/form-light.png" alt="Form">\n</picture>\n\n![x](../images/create-teams/form-light.png)\n[Home](../index.md) · [web](https://example.org/)\n',
    "about/privacy.md": "# Privacy and data\n\nBack to [Create teams](../how-to/create-teams.md).\n",
    "reference/url-parameters.md": "# URL parameters\n",
    "API.md": "# API — App\n\nSee [DECISIONS](DECISIONS.md).\n",
    "SPEC.md": "# Spec\n",
    "DECISIONS.md": "# Decisions\n",
  };
  for (const [f, text] of Object.entries(files)) { mkdirSync(dirname(join(docs, f)), { recursive: true }); writeFileSync(join(docs, f), text); }
  mkdirSync(join(docs, "images", "create-teams"), { recursive: true });
  writeFileSync(join(docs, "images", "create-teams", "form-light.png"), "L");
  writeFileSync(join(docs, "images", "create-teams", "form-dark.png"), "D");
  return { docs, wiki: join(root, "wiki") };
}

test("wikiName turns an H1 into a wiki page name", () => {
  assert.equal(wikiName("Install TeamSync and use it offline"), "Install-TeamSync-and-use-it-offline");
  assert.equal(wikiName("URL parameters: and/or embedding"), "URL-parameters-andor-embedding");
});

test("mirrors user pages only, with wiki names, rewritten links and images", () => {
  const { docs, wiki } = fixture();
  mirror(docs, wiki, "o/r");
  for (const f of ["Home.md", "Create-teams.md", "Privacy-and-data.md", "URL-parameters.md", "For-developers.md", "_Sidebar.md", "_Footer.md", "images/create-teams/form-light.png"]) assert.ok(existsSync(join(wiki, f)), f);
  assert.ok(!existsSync(join(wiki, "Spec.md")) && !existsSync(join(wiki, "Decisions.md")));
  const page = readFileSync(join(wiki, "Create-teams.md"), "utf8");
  assert.ok(page.startsWith(MARKER));
  assert.match(page, /\[privacy\]\(Privacy-and-data#stored\)/);
  assert.match(page, /\[spec\]\(https:\/\/github\.com\/o\/r\/blob\/HEAD\/docs\/SPEC\.md\)/);
  assert.match(page, /srcset="images\/create-teams\/form-dark\.png"/);
  assert.match(page, /<img src="images\/create-teams\/form-light\.png"/);
  assert.match(page, /!\[x\]\(images\/create-teams\/form-light\.png\)/);
  assert.match(page, /\[Home\]\(Home\) · \[web\]\(https:\/\/example\.org\/\)/);
  assert.equal(readFileSync(join(wiki, "_Footer.md"), "utf8"), FOOTER);
  const side = readFileSync(join(wiki, "_Sidebar.md"), "utf8");
  assert.match(side, /\*\*How-to guides\*\*\n- \[Create teams\]\(Create-teams\)/);
  assert.match(side, /\*\*Reference\*\*\n- \[URL parameters\]\(URL-parameters\)/);
  assert.equal(side.match(/\*\*About\*\*/g)?.length, 1);
  assert.match(side, /\*\*For developers\*\*\n- \[For developers\]\(For-developers\)/);
});

test("removes only its own stale files and is idempotent", () => {
  const { docs, wiki } = fixture();
  mirror(docs, wiki);
  writeFileSync(join(wiki, "Hand-written.md"), "# Mine\n");
  writeFileSync(join(docs, "about", "privacy.md"), "# Privacy\n"); // renamed page
  writeFileSync(join(docs, "images", "create-teams", "form-dark.png"), "D2");
  const { removed } = mirror(docs, wiki);
  assert.deepEqual(removed, ["Privacy-and-data.md"]);
  assert.ok(existsSync(join(wiki, "Privacy.md")) && existsSync(join(wiki, "Hand-written.md")));
  assert.equal(readFileSync(join(wiki, "images/create-teams/form-dark.png"), "utf8"), "D2");
  assert.deepEqual(mirror(docs, wiki), { written: [], removed: [] });
});

test("refuses to overwrite a wiki page it did not write", () => {
  const { docs, wiki } = fixture();
  mkdirSync(wiki, { recursive: true });
  writeFileSync(join(wiki, "Create-teams.md"), "# Hand-made page\n");
  assert.throws(() => mirror(docs, wiki), /was not generated/);
});

test("replaces the hand-made first page (Home) that GitHub needs before the wiki exists", () => {
  const { docs, wiki } = fixture();
  mkdirSync(wiki, { recursive: true });
  writeFileSync(join(wiki, "Home.md"), "Welcome to the wiki!\n");
  mirror(docs, wiki);
  assert.ok(readFileSync(join(wiki, "Home.md"), "utf8").startsWith(MARKER));
});
