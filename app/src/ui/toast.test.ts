// Unit tests for the toast timer (forge-design → accessibility §5): action toasts wait while the
// person hovers or focuses them. The DOM parts are covered by tests/e2e/shell.spec.ts.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../i18n/index.ts", () => ({ t: (key: string) => key }));
vi.mock("./dom.ts", () => ({ h: vi.fn() }));
const { pausableTimer } = await import("./toast.ts");

afterEach(() => { vi.useRealTimers(); });

describe("pausableTimer", () => {
  it("ends after the duration when never paused", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    pausableTimer(10_000, onEnd);
    vi.advanceTimersByTime(9_999);
    expect(onEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("never ends while paused, then runs only the remaining time", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const timer = pausableTimer(10_000, onEnd);
    vi.advanceTimersByTime(4_000);
    timer.pause();
    vi.advanceTimersByTime(60_000); // hovered/focused for a minute
    expect(onEnd).not.toHaveBeenCalled();
    timer.resume();
    vi.advanceTimersByTime(5_999);
    expect(onEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("pause/resume twice in a row is harmless; cancel stops it", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const timer = pausableTimer(1_000, onEnd);
    timer.pause();
    timer.pause();
    timer.resume();
    timer.resume();
    timer.cancel();
    vi.advanceTimersByTime(5_000);
    expect(onEnd).not.toHaveBeenCalled();
  });
});
