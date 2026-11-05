// public/error-page.js — fills the requested path into 404.html and the report link.
// External file (CSP forbids inline scripts). textContent only — never innerHTML.
(function () {
  var path = decodeURIComponent(location.pathname + location.search).slice(0, 200);
  var el = document.querySelector("[data-ep-path]");
  if (el) el.textContent = path;
  var report = document.querySelector("[data-ep-report]");
  if (report) {
    var body = "Broken link: " + location.href + "\nReferrer: " + (document.referrer || "(none)");
    report.href += "&body=" + encodeURIComponent(body);
  }
})();
