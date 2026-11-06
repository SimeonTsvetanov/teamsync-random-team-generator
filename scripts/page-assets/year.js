// public/year.js — runtime year (never hard-coded) and the contact email assembled from data
// attributes (never plain text in HTML, against spam scraping — APP-STANDARD §7).
document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll("[data-email-user]").forEach(function (a) {
  var email = `${a.getAttribute("data-email-user")}@${a.getAttribute("data-email-domain")}`;
  a.setAttribute("href", `mailto:${email}`);
  a.textContent = email;
});
