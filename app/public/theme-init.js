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
})();
