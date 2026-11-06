/**
 * Smooth, app-like change of what is on screen (results appear, a step changes) with the View
 * Transitions API; instant where unsupported or when the user asks for reduced motion.
 * Page-to-page navigation (app ↔ policy pages) uses CSS `@view-transition` in app.css/page.css.
 */
export function withTransition(update: () => void): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("startViewTransition" in document)) {
    update();
    return;
  }
  document.startViewTransition(update);
}
