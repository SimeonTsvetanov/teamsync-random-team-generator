let running = false;
/** True while a long task runs (no reload prompts, title shows progress). */
export const isTaskRunning = (): boolean => running;
export function setTaskRunning(value: boolean): void {
  running = value;
  if (!value) document.dispatchEvent(new Event("task:idle"));
}
