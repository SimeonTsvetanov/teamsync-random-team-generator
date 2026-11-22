// Renders screen.html into an empty mount element (Quizzard). A separate chunk: the standalone page
// already has the markup, so its first load never downloads this (engineering → performance §2).
import { fragmentFromMarkup } from "../dom/template.ts";
import screenMarkup from "../screen.html?raw";

/** Appends the team screen's markup to `element`. */
export function renderScreen(element: HTMLElement): void {
  element.append(fragmentFromMarkup(screenMarkup));
}
