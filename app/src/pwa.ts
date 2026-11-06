// src/pwa.ts — service worker registration with the update toast (APP-STANDARD §1).
// Never reloads by itself; never during a running task. Uses the toast from the app shell.
import { registerSW } from "virtual:pwa-register";
import { showToast } from "./ui/toast.ts";
import { isTaskRunning } from "./state.ts";
import { t } from "./i18n/index.ts";

export function initPwa(): void {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      const offer = (): void => {
        showToast({
          message: t("shell.update.available"),
          action: {
            label: t("shell.update.reload"),
            run: () => {
              void updateSW(true);
            },
          },
          persistent: true,
        });
      };
      // Wait until the current task finishes, then offer the reload.
      if (isTaskRunning()) document.addEventListener("task:idle", offer, { once: true });
      else offer();
    },
    onOfflineReady() {
      showToast({ message: t("shell.update.offlineReady") });
    },
    onRegisterError(error) {
      console.warn("Service worker registration failed", error);
    },
  });
}
