<!-- Template from APP-STANDARD §6 (2026-11-05). Not legal advice. One bullet per layer the app really has. -->

**Privacy** — Last updated: 7 November 2026

- **Who is responsible:** TeamSync is made by Simeon Tsvetanov, Bulgaria (contact: {email}).
  The names you type stay on your device and under your control only.
- **In the browser:** the names you type are split into teams entirely on your device. They are
  not uploaded anywhere. Names are never put in TeamSync links (only the number of teams, e.g.
  `?teams=3`). Please only enter names of people who are fine with it — they stay on this device.
- **Sharing:** when you tap Share, WhatsApp or Copy, the teams text goes to the app you choose
  and is then covered by that app's own privacy terms. On Android, a list you share *into*
  TeamSync arrives in the address and is removed from it right away.
- **Stored on your device only:** your settings (theme, language, number of teams), your last
  names list (so it is still there next time), which tips and prompts you already dismissed, and
  an unsent problem report draft (its text) are kept in your browser's own storage on this
  device (local storage). They never leave your device and are not synced anywhere. TeamSync
  does not save anything in IndexedDB or the browser's private file storage (OPFS); Settings →
  Storage only looks there when you export or clear your data. You can see the space used,
  export, or delete your data in **Settings → Storage**, or by clearing this site's data in your
  browser.
- **Offline copy:** so TeamSync works without internet, your browser keeps an offline copy of the
  app's own files (not your names) in its Cache Storage, managed by a service worker. If you tap
  **Keep data on this device** in Settings → Storage, the app asks the browser to keep this site's storage
  persistent (`navigator.storage.persist()`), so it is not cleared automatically when space runs
  low. Clearing this site's data removes both.
- **No accounts, no ads, no tracking, no cookies, no analytics.**
- **Local AI-agent tool (MCP):** if you run `npx -y @simeonts/teamsync-random-team-generator-mcp`,
  it runs on your own computer; the names your agent sends to it are not sent to us.
- **Problem reports:** if you send a report, its text and the diagnostics you leave ticked are
  posted as a **public** GitHub issue through GitHub (you need a free GitHub account); GitHub's
  privacy statement applies. TeamSync does not ask for or send your email.
- **Hosting:** the site is hosted on GitHub Pages. GitHub logs visitor IP addresses for security
  purposes — see the GitHub Privacy Statement.
- **Email to the contact address:** if you write to {email}, your message and address are used
  only to answer you, are not shared with anyone, and are kept no longer than needed for that.
- **Contact:** {email}
