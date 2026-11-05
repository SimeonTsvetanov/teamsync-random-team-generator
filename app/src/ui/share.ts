import { app } from "../config.ts";
import { showToast } from "./toast.ts";

/** Share app: native share sheet, fallback copy link (APP-STANDARD §1.1). */
export async function shareApp(): Promise<void> {
  const data = { title: app.name, text: app.tagline, url: app.url };
  if ("share" in navigator) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(app.url);
    showToast({ message: "Link copied ✓" });
  } catch {
    showToast({ message: app.url, persistent: true });
  }
}
