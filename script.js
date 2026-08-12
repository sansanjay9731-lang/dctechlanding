/* =================================================================
   DC Tech — GPU-Accelerated AI Infrastructure
   Funnel: Readiness Quiz → (pass) Checkout / (brush up) Reading list.
   UTM capture + forwarding · CTA wiring · reveal-on-scroll.
   ================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     CONFIG — the swappable knobs. Edit these, nothing else.

     The pass/brush-up routing happens INSIDE the Google Form
     (Form → Settings → "Presentation" / response-based redirect):
       • high score  → CHECKOUT_URL
       • low score   → reading-list.html
     This page only needs to LAUNCH the quiz and the checkout.
     --------------------------------------------------------------- */
  const QUIZ_URL        = "TODO(rashmi): Readiness Quiz Google Form URL (e.g. https://forms.gle/...)";
  const CHECKOUT_URL    = "TODO(rashmi): Stripe / checkout URL for the $199 enrolment";
  const SYLLABUS_PDF_URL = "TODO(rashmi): full syllabus PDF URL";
  const READING_LIST_URL = "reading-list.html"; // built — brush-up redirect target

  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  const isTodo = (v) => /^TODO/.test(v);

  /* ---------------------------------------------------------------
     UTM CAPTURE — snapshot once on load so every click is attributed.
     --------------------------------------------------------------- */
  const UTMS = (function readUtms() {
    const qs = new URLSearchParams(location.search);
    const out = {};
    UTM_KEYS.forEach((k) => { const v = qs.get(k); if (v) out[k] = v; });
    return out;
  })();

  // Append captured UTMs to an outbound URL so ad attribution survives the
  // redirect into the Google Form / Stripe checkout.
  function withUtms(url) {
    if (!Object.keys(UTMS).length) return url;
    try {
      const u = new URL(url, location.href);
      Object.entries(UTMS).forEach(([k, v]) => u.searchParams.set(k, v));
      return u.toString();
    } catch (_) {
      return url; // malformed/placeholder URL — leave as-is
    }
  }

  /* ---------------------------------------------------------------
     CTA WIRING — point each CTA class at its destination.
     While a URL is still a TODO, the link keeps its in-page anchor
     fallback (href in the HTML) so nothing 404s during preview.
     --------------------------------------------------------------- */
  function wire(selector, url, { external = true, attribute = false } = {}) {
    const ready = !isTodo(url);
    document.querySelectorAll(selector).forEach((a) => {
      if (!ready) return; // keep the HTML anchor fallback
      a.href = attribute ? url : withUtms(url);
      if (external) { a.target = "_blank"; a.rel = "noopener"; }
    });
  }

  function wireCtas() {
    wire(".js-cta-quiz", QUIZ_URL);
    wire(".js-cta-enroll", CHECKOUT_URL);
    wire(".js-cta-syllabus", SYLLABUS_PDF_URL);
    // reading list is a local page; forward UTMs but keep same-tab navigation
    document.querySelectorAll(".js-cta-reading").forEach((a) => { a.href = withUtms(READING_LIST_URL); });

    // Helpful console hint while endpoints are pending.
    const pending = [
      isTodo(QUIZ_URL) && "QUIZ_URL",
      isTodo(CHECKOUT_URL) && "CHECKOUT_URL",
      isTodo(SYLLABUS_PDF_URL) && "SYLLABUS_PDF_URL",
    ].filter(Boolean);
    if (pending.length) {
      console.warn("[DC Tech] Pending config in script.js: " + pending.join(", ") +
        ". CTAs fall back to in-page anchors until these are set.");
    }
  }

  /* ---------------------------------------------------------------
     REVEAL-ON-SCROLL — light IntersectionObserver, no library.
     --------------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function init() { wireCtas(); initReveal(); initYear(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
