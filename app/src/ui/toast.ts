export interface ToastOptions {
  readonly message: string;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly persistent?: boolean;
}

/** Shows one toast at a time in the polite live region. */
export function showToast({ message, action, persistent = false }: ToastOptions): void {
  const region = document.querySelector<HTMLElement>("[data-toasts]");
  if (!region) return;
  region.replaceChildren();
  const toast = document.createElement("div");
  toast.className = "toast";
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = action.label;
    b.addEventListener("click", action.run);
    toast.append(b);
  }
  region.append(toast);
  if (!persistent) setTimeout(() => { toast.remove(); }, 5000);
}
