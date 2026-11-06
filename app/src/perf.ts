/**
 * Keep the app responsive (INP < 200 ms — forge-engineering → performance): inside long loops
 * (parsing, generating, processing many items) call `await yieldToMain()` every ~50 ms of work so
 * taps and typing are handled. Uses `scheduler.yield()` where available.
 */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (s?.yield) return s.yield();
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

/** Runs `work` over items, yielding to the browser every `budgetMs`. */
export async function eachWithYield<T>(items: Iterable<T>, work: (item: T) => void, budgetMs = 50): Promise<void> {
  let start = performance.now();
  for (const item of items) {
    work(item);
    if (performance.now() - start > budgetMs) {
      await yieldToMain();
      start = performance.now();
    }
  }
}
