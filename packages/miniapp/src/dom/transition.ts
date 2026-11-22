// Smooth change of what is on screen (results appear, back to the names) — a copy of the standalone
// app's ui/transition.ts, which the package cannot import.

/**
 * Runs `update` inside a View Transition; at once where unsupported or with reduced motion.
 * @param update - the DOM change
 */
export function withTransition(update: () => void): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("startViewTransition" in document)) {
    update();
    return;
  }
  document.startViewTransition(update);
}
