// public/error-page.js — fills the requested path into 404.html and the report link.
// External file (CSP forbids inline scripts). textContent only — never innerHTML.
// Offline (the service worker served this page for an uncached address): show the offline variant.
(function () {
  if (!navigator.onLine) {
    document.querySelectorAll("[data-ep-offline-text]").forEach(function (el) { el.textContent = el.getAttribute("data-ep-offline-text"); });
    document.querySelectorAll("[data-ep-online]").forEach(function (el) { el.hidden = true; });
    document.querySelectorAll("[data-ep-offline]").forEach(function (el) { el.hidden = false; });
    document.title = document.title.replace(/^[^·]*/, "Offline ");
  }
  var path = decodeURIComponent(location.pathname + location.search).slice(0, 200);
  var el = document.querySelector("[data-ep-path]");
  if (el) el.textContent = path;
  var report = document.querySelector("[data-ep-report]");
  if (report) {
    var body = `Broken link: ${location.href}\nReferrer: ${document.referrer || "(none)"}`;
    report.href += `&body=${encodeURIComponent(body)}`;
  }
})();
