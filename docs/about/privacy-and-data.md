# Privacy and data

TeamSync is built so the names you enter stay on your device. This page explains what TeamSync stores, where, and when anything leaves your device. The full legal text is the [Privacy notice](https://simeontsvetanov.github.io/teamsync-random-team-generator/privacy/).

## Everything runs on your device

TeamSync splits the names into teams entirely in your browser. It has no server, no accounts, no ads, no tracking, no cookies and no analytics. The names aren't uploaded anywhere, and they're never put in TeamSync links: a link carries only the number of teams, for example `?teams=3`.

Enter only names of people who are fine with it, because they stay on this device.

## What TeamSync stores

TeamSync keeps the following in your browser's local storage on this device:

- Your settings: theme, language and number of teams.
- Your last names list, so it's there next time.
- Which tips and prompts you already dismissed.
- The text of a problem report you started but didn't send.

This data never leaves your device and isn't synced anywhere. To see the space used, export, or delete it, go to **Menu** > **Settings** > **Storage**. Clearing this site's data in your browser also deletes it. The author can't see, back up or recover it, so use **Export my data** if you want a copy.

## The offline copy

So TeamSync works without internet, your browser keeps an offline copy of the app's own files in its Cache Storage, managed by a service worker. The offline copy doesn't contain your names. If you select **Keep data on this device** in **Settings**, TeamSync asks the browser not to clear its storage when space runs low. Clearing this site's data removes both.

## When data leaves your device

Data leaves your device only in the following cases, and only when you start them:

- **Share, WhatsApp or Copy:** the teams text goes to the app you choose and is covered by that app's privacy terms.
- **Share into TeamSync on Android:** a list you share into TeamSync arrives in the address and is removed from it right away.
- **Report a problem:** the report text and the technical details you leave ticked become a public GitHub issue. A free GitHub account is needed, and GitHub's privacy statement applies.
- **The MCP server for AI agents:** it runs on your own computer. The names your agent sends to it aren't sent to TeamSync.
- **Hosting:** TeamSync is hosted on GitHub Pages, which logs visitor IP addresses for security.

## How the teams are made

TeamSync uses the Fisher–Yates shuffle with your device's secure random numbers, so every possible split is equally likely. Team sizes differ by at most one, and bigger teams come first. The teams are random, not balanced by skill.

## Related

- [Keep or clear your names list](../how-to/manage-names-list.md)
- [Settings and limits](../reference/settings.md)
- [TeamSync user documentation](../index.md)
