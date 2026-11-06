import "@fontsource-variable/inter";
import "../../design/tokens.css";
import "./generated/accent.css"; // per-app accent from app.config (empty = default)
import "./styles/app.css";
import { app } from "./config.ts";
import { hydrateIcons } from "./ui/icons.ts";
import { applyTheme, getTheme, initTheme } from "./ui/theme.ts";
import { initI18n } from "./i18n/index.ts";
import { shareApp } from "./ui/share.ts";
import { installErrorScreen } from "./ui/error-screen.ts";
import { initOfflineIndicator } from "./ui/offline.ts";
import { initTitle } from "./ui/title.ts";
import { openHelp } from "./ui/help.ts";
import { openSettings } from "./ui/settings.ts";
import { openAbout } from "./ui/about.ts";
import { maybeShowWhatsNew, openWhatsNew } from "./ui/whats-new.ts";
import { flushReportQueue, openReport } from "./ui/report.ts";
import { initInstall, openInstall, updateMenuLabel } from "./ui/install.ts";
import { initPwa } from "./pwa.ts";
import { initShareTarget } from "./ui/share-target.ts";

initI18n(); // first: every later module (incl. the error screen) uses t()
installErrorScreen();
// Embed mode (iframe or ?embed=1): no install prompt, no support line, compact chrome (APP-STANDARD §1).
if (window.self !== window.top || new URLSearchParams(location.search).has("embed")) {
  document.documentElement.classList.add("is-embed");
}
initShareTarget(); // before app code reads the URL
hydrateIcons();
initTheme();
initOfflineIndicator();
initTitle();
initInstall();
// Language switch: static HTML is re-translated by setLanguage(); refresh the JS-set labels too.
document.addEventListener("i18n:change", () => { applyTheme(getTheme()); updateMenuLabel(); });

// Footer: runtime year (never hard-coded) and version.
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = app.version; });

// Contact email rendered by JS only (anti-scraping, APP-STANDARD §7).
document.querySelectorAll<HTMLAnchorElement>("[data-contact]").forEach((a) => {
  a.href = `mailto:${app.contact.email}`;
  a.textContent = app.contact.email;
});

// Actions: menu items, header buttons and deep links (#help, #settings, …) share one table.
const menu = document.querySelector<HTMLDialogElement>("[data-menu]");
const actions: Record<string, () => void> = {
  help: openHelp, settings: openSettings, about: openAbout, "whats-new": openWhatsNew, report: openReport,
  install: openInstall, share: () => { void shareApp(); },
};
document.addEventListener("click", (e) => {
  const target = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-action]") : null;
  const name = target?.dataset["action"];
  if (!name || !(name in actions)) return;
  e.preventDefault();
  menu?.close();
  actions[name]?.();
});
const openFromHash = (): void => {
  const name = location.hash.slice(1);
  if (name !== "share" && name in actions) actions[name]?.();
};
window.addEventListener("hashchange", openFromHash);
openFromHash();

document.querySelector("[data-menu-open]")?.addEventListener("click", () => {
  menu?.showModal();
});
document.querySelector("[data-menu-close]")?.addEventListener("click", () => { menu?.close(); });
// Light dismiss: a tap outside the menu closes it.
menu?.addEventListener("click", (e) => {
  const r = menu.getBoundingClientRect();
  if (e.target === menu && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) menu.close();
});

// Header shadow after scrolling (IntersectionObserver, no scroll listeners).
const header = document.querySelector<HTMLElement>("[data-header]");
const sentinel = document.querySelector("[data-sentinel]");
if (header && sentinel) {
  new IntersectionObserver(([entry]) => {
    header.toggleAttribute("data-scrolled", entry ? !entry.isIntersecting : false);
  }).observe(sentinel);
}

window.addEventListener("online", flushReportQueue);
flushReportQueue();
maybeShowWhatsNew();
initPwa();
