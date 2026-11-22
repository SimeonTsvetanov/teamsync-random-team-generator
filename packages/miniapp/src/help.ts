// Help of the Teams screen per language (contract `HelpSection`): Quizzard's Help dialog loads it
// lazily (`MiniAppEntry.help`); app.config.ts imports the same data for the standalone site's Help,
// static page, FAQ JSON-LD and llms.txt — one source, no copy.
import type { HelpSection } from "./contract.ts";

/** Help texts in every language the body translates. */
export interface TeamsHelp {
  readonly en: HelpSection;
  readonly bg: HelpSection;
}

/**
 * Quick-start steps (exact UI labels), every feature and the FAQ, in English and Bulgarian.
 * @remarks Both languages keep the same number of items (generate.ts and help.test.ts check).
 */
export const help: TeamsHelp = {
  en: {
    steps: [
      "Type or paste the names, one per line.",
      "Choose how many teams with − and +.",
      "Tap “Generate teams”.",
      "Not happy? Tap “Shuffle again” — then Copy or Share the teams.",
    ],
    features: [
      { name: "Fair shuffle", text: "Every possible split is equally likely (Fisher–Yates with your device's secure random numbers). Team sizes differ by at most one, bigger teams first." },
      { name: "Remembers your list", text: "Your last names list and number of teams stay on this device, so a weekly game is one tap. Clear removes the list (with Undo); Settings → Clear my data removes everything." },
      { name: "Copy, Share and WhatsApp", text: "Copy gives a ready-to-paste text for any chat; Share opens your phone's share sheet; WhatsApp opens a new message with the teams (WhatsApp Web on a computer)." },
      { name: "Bring a list from a chat", text: "Paste a list from WhatsApp, Viber or notes — numbers, bullets, emoji and “[time] Name:” prefixes are removed automatically. On Android you can also select the message, tap Share and choose TeamSync (after installing it)." },
      { name: "Link with the number of teams", text: "Links like ?teams=3 open TeamSync with 3 teams selected. Names are never part of a link." },
      { name: "Works offline", text: "After the first visit TeamSync works without internet; install it to open it like an app." },
      { name: "Keyboard", text: "Ctrl+Enter (⌘+Enter on a Mac) in the names box makes the teams; Tab moves through every control." },
    ],
    faq: [
      { q: "Is TeamSync free?", a: "Yes. It is free and open source (MIT licence), with no ads and no sign-up." },
      { q: "Are the teams really fair?", a: "Yes. TeamSync uses the Fisher–Yates shuffle with your device's secure random numbers, so every split is equally likely. Team sizes differ by at most one." },
      { q: "Are the names sent anywhere?", a: "No. Everything is computed in your browser on your device. Names are not uploaded and are never put in links." },
      { q: "How many names and teams can I use?", a: "Up to 1,000 names and 2 to 10 teams. A name can have up to 100 characters; duplicate names are allowed." },
      { q: "Does it work offline?", a: "Yes, after the first visit. You can also install it on your phone or computer to open it like an app." },
      { q: "How do I send the teams to my group chat?", a: "Tap WhatsApp for a new message with the teams, Share to pick any other app, or Copy and paste the text anywhere." },
      { q: "Can I take the list from WhatsApp?", a: "Yes. Copy the message with the list and paste it — TeamSync keeps only the names. On Android: install TeamSync, then in WhatsApp choose Share → TeamSync." },
      { q: "Can an AI agent make teams with TeamSync?", a: "Yes. The local MCP server (npx -y @simeonts/teamsync-random-team-generator-mcp) provides the make_teams tool: give it the names and the number of teams, and it returns the teams." },
    ],
  },
  bg: {
    steps: [
      "Напишете или поставете имената, по едно на ред.",
      "Изберете броя на отборите с − и +.",
      "Натиснете „Направи отбори“.",
      "Не ви харесва разпределението? Натиснете „Разбъркай отново“ — после Копирай или Сподели.",
    ],
    features: [
      { name: "Честно разбъркване", text: "Всяко разпределение е еднакво вероятно (алгоритъм на Фишер–Йейтс със сигурните случайни числа на устройството). Отборите се различават с най-много един човек, по-големите са първи." },
      { name: "Помни списъка", text: "Последният списък с имена и броят отбори остават на това устройство, така че седмичният мач е на едно натискане. „Изчисти“ маха списъка (с възможност за отмяна); Настройки → Изтрий данните ми маха всичко." },
      { name: "Копиране, споделяне и WhatsApp", text: "„Копирай“ дава готов текст за всеки чат; „Сподели“ отваря менюто за споделяне на телефона; „WhatsApp“ отваря ново съобщение с отборите (WhatsApp Web на компютър)." },
      { name: "Списък от чат", text: "Поставете списък от WhatsApp, Viber или бележки — номерата, тиретата, емоджитата и „[час] Име:“ се махат автоматично. На Android можете и да маркирате съобщението, да натиснете Сподели и да изберете TeamSync (след като го инсталирате)." },
      { name: "Линк с броя отбори", text: "Линк като ?teams=3 отваря TeamSync с избрани 3 отбора. Имената никога не са част от линк." },
      { name: "Работи без интернет", text: "След първото посещение TeamSync работи без интернет; инсталирайте го, за да се отваря като приложение." },
      { name: "Клавиатура", text: "Ctrl+Enter (⌘+Enter на Mac) в полето с имената прави отборите; Tab минава през всички бутони." },
    ],
    faq: [
      { q: "Безплатен ли е TeamSync?", a: "Да. Безплатен е, с отворен код (лиценз MIT), без реклами и без регистрация." },
      { q: "Наистина ли разпределението е честно?", a: "Да. Използва се алгоритъмът на Фишер–Йейтс със сигурните случайни числа на устройството, така че всяко разпределение е еднакво вероятно. Отборите се различават с най-много един човек." },
      { q: "Изпращат ли се имената някъде?", a: "Не. Всичко се изчислява в браузъра на Вашето устройство. Имената не се качват и не влизат в линкове." },
      { q: "Колко имена и отбори мога да имам?", a: "До 1000 имена и от 2 до 10 отбора. Едно име може да е до 100 знака; еднакви имена са позволени." },
      { q: "Работи ли без интернет?", a: "Да, след първото посещение. Можете и да го инсталирате на телефона или компютъра, за да се отваря като приложение." },
      { q: "Как да изпратя отборите в чата?", a: "Натиснете „WhatsApp“ за ново съобщение с отборите, „Сподели“, за да изберете друго приложение, или „Копирай“ и поставете текста където искате." },
      { q: "Мога ли да взема списъка от WhatsApp?", a: "Да. Копирайте съобщението със списъка и го поставете — TeamSync оставя само имената. На Android: инсталирайте TeamSync, после в WhatsApp изберете Сподели → TeamSync." },
      { q: "Може ли AI агент да прави отбори с TeamSync?", a: "Да. Локалният MCP сървър (npx -y @simeonts/teamsync-random-team-generator-mcp) дава инструмента make_teams: подавате имената и броя отбори и получавате отборите." },
    ],
  },
};

// The contract's `MiniAppEntry.help` loads this module and reads its default export.
export default help;
