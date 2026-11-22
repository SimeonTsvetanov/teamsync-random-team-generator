import { expect, test } from "@playwright/test";

/**
 * Cascade-layer order every app ships (forge-design → css-architecture §1). The bundler may drop
 * the `@layer a, b;` statement in app.css, and then the FIRST `@layer x { … }` block of each name
 * fixes the order — an import moved above tokens.css would silently flip which rules win.
 */
const LAYER_ORDER = ["tokens", "base", "layout", "components", "utilities", "overrides"];

test("built CSS declares the cascade layers in the forge order", async ({ page }) => {
  await page.goto("./");
  // Read in the browser: CSSOM is what the cascade really uses, whatever the bundler emitted.
  const firstSeen = await page.evaluate(() => {
    const layerNames = (rule: CSSRule): string[] => {
      if (rule instanceof CSSLayerStatementRule) return [...rule.nameList];
      if (rule instanceof CSSLayerBlockRule) return [rule.name];
      return [];
    };
    const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
    return [...new Set(rules.flatMap(layerNames))];
  });
  expect(firstSeen).toEqual(LAYER_ORDER);
});
