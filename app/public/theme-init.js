// public/theme-init.js — load as the FIRST <script> in <head>, blocking (no defer/async):
//   <script src="./theme-init.js"></script>
// Sets data-theme before CSS paints, so there is no flash of the wrong theme. External file
// because the meta CSP forbids inline scripts. Replace teamsync-random-team-generator with app.id.
// The storage module saves values as JSON ("dark" with quotes), so parse before comparing.
(function () {
  try {
    var raw = localStorage.getItem("teamsync-random-team-generator:v1:theme");
    var t = raw === null ? null : JSON.parse(raw);
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    /* storage blocked or unreadable: follow the system theme */
  }
  // Launch splash (logo + tagline, ~1.3 s) once per browser session — not in an iframe, not for
  // deep links (#help…) or shared content. CSS shows .splash only under [data-splash]; main.ts
  // removes it. Without JS/CSS support it simply never appears.
  try {
    var q = location.search;
    // navigator.webdriver: automated tests skip it (one e2e test turns it back on).
    if (window.self === window.top && !navigator.webdriver && !location.hash && q.indexOf("share-target") < 0 && q.indexOf("embed") < 0 &&
        !sessionStorage.getItem("teamsync-random-team-generator:v1:splash")) {
      document.documentElement.setAttribute("data-splash", "");
      sessionStorage.setItem("teamsync-random-team-generator:v1:splash", "1");
    }
  } catch (e) {
    /* storage blocked: no splash */
  }
})();
