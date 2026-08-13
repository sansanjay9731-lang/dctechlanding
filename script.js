/* =================================================================
   DC Tech — GPU-Accelerated AI Infrastructure
   Funnel: Enroll Now → Checkout / enrollment form.
   UTM capture + forwarding · CTA wiring · reveal-on-scroll.
   ================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     CONFIG — the swappable knobs. Edit these, nothing else.

     Every "Enroll Now" CTA points at CHECKOUT_URL (the enrollment
     Google Form / payment link). UTMs are forwarded onto it so ad
     attribution survives the redirect.
     --------------------------------------------------------------- */
  const CHECKOUT_URL    = "https://docs.google.com/forms/d/e/1FAIpQLSfd7ONJXJsGqjSq0Qa6lybhF2u-jgLMXNq7fMsVsd4fYwm_1Q/viewform";
  const SYLLABUS_PDF_URL = "TODO(rashmi): full syllabus PDF URL";
  const READING_LIST_URL = "reading-list.html"; // standalone recommended-reading resource

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
      if (external) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    });
  }

  function wireCtas() {
    wire(".js-cta-enroll", CHECKOUT_URL);
    wire(".js-cta-syllabus", SYLLABUS_PDF_URL);
    // reading list is a local page; forward UTMs but keep same-tab navigation
    document.querySelectorAll(".js-cta-reading").forEach((a) => { a.href = withUtms(READING_LIST_URL); });

    // Helpful console hint while endpoints are pending.
    const pending = [
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

  /* ---------------------------------------------------------------
     GPU CHIP MOTION GRAPHIC
     Builds SM core grid, runs random activation loop, draws
     SVG data-flow paths with animateMotion particles.
     --------------------------------------------------------------- */
  function initGpuChip() {
    const coreContainer = document.getElementById("gpu-cores");
    if (!coreContainer) return;

    /* Build 8 × 10 SM core grid */
    const COLS = 8, ROWS = 10;
    const cores = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const el = document.createElement("div");
      el.className = "gpu__core";
      coreContainer.appendChild(el);
      cores.push(el);
    }

    /* Random core activation — simulates compute load */
    const active = new Map(); // idx → "active" | "hot"

    function tick() {
      // Cool down some cores
      active.forEach(function (level, idx) {
        if (Math.random() < 0.3) {
          if (level === "hot") {
            cores[idx].classList.remove("hot");
            cores[idx].classList.add("active");
            active.set(idx, "active");
          } else {
            cores[idx].classList.remove("active", "hot");
            active.delete(idx);
          }
        }
      });

      // Activate new cores
      var n = Math.floor(Math.random() * 12) + 6;
      for (var i = 0; i < n; i++) {
        var idx = Math.floor(Math.random() * cores.length);
        if (!active.has(idx)) {
          var level = Math.random() < 0.22 ? "hot" : "active";
          cores[idx].classList.add(level);
          active.set(idx, level);
        }
      }
      setTimeout(tick, 90 + Math.random() * 90);
    }
    tick();

    /* SVG data flow paths — HBM ↔ die edges */
    var svg = document.getElementById("gpu-svg");
    if (!svg) return;

    // Paths are defined in the SVG coordinate space (viewBox 0 0 360 420).
    // HBM-L occupies x≈10–52, die x≈108–252, HBM-R x≈308–350.
    // Vertical range of memory buses: y 80..320.
    var pathDefs = [
      { d: "M 52 90  L 108 90",  cls: "",    dur: 1.1, begin: 0    },
      { d: "M 52 200 L 108 200", cls: "",    dur: 1.3, begin: 0.6  },
      { d: "M 52 310 L 108 310", cls: "",    dur: 1.0, begin: 1.2  },
      { d: "M 308 110 L 252 110",cls: "--r", dur: 1.2, begin: 0.3  },
      { d: "M 308 220 L 252 220",cls: "--r", dur: 1.4, begin: 0.9  },
      { d: "M 308 330 L 252 330",cls: "--r", dur: 1.0, begin: 1.5  },
    ];

    var NS    = "http://www.w3.org/2000/svg";
    var XLNS  = "http://www.w3.org/1999/xlink";

    pathDefs.forEach(function (def, i) {
      var pathId = "gp" + i;

      /* Dashed path line */
      var path = document.createElementNS(NS, "path");
      path.setAttribute("id", pathId);
      path.setAttribute("d", def.d);
      path.setAttribute("class", "gpu__path" + (def.cls ? " gpu__path" + def.cls : ""));
      svg.appendChild(path);

      /* Travelling particle */
      var circle = document.createElementNS(NS, "circle");
      circle.setAttribute("r", "2");
      circle.setAttribute("class", "gpu__particle");

      var motion = document.createElementNS(NS, "animateMotion");
      motion.setAttribute("dur", def.dur + "s");
      motion.setAttribute("repeatCount", "indefinite");
      motion.setAttribute("begin", def.begin + "s");

      var mpath = document.createElementNS(NS, "mpath");
      mpath.setAttribute("href", "#" + pathId);
      mpath.setAttributeNS(XLNS, "xlink:href", "#" + pathId);

      motion.appendChild(mpath);
      circle.appendChild(motion);
      svg.appendChild(circle);
    });
  }


     COUNT-UP ANIMATION — runs once when specrow scrolls into view.
     Easing: ease-out cubic. Each stat card staggers by 80ms.
     --------------------------------------------------------------- */
  function initCountUp() {
    const dts = document.querySelectorAll(".specrow dt[data-count]");
    if (!dts.length) return;

    // Ease-out cubic: fast start → slows to final value
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCounter(el, target, duration, delay) {
      setTimeout(function () {
        el.classList.add("counting");
        const start = performance.now();
        function step(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased   = easeOutCubic(progress);
          el.textContent = Math.round(eased * target);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = target;
            el.classList.remove("counting");
          }
        }
        requestAnimationFrame(step);
      }, delay);
    }

    // Fire after hero-in animation completes (specrow is above fold — no IO needed)
    setTimeout(function () {
      dts.forEach(function (dt, i) {
        var target = parseInt(dt.dataset.count, 10);
        var duration = target >= 100 ? 1400 : target >= 10 ? 900 : 600;
        animateCounter(dt, target, duration, i * 80);
      });
    }, 600);
  }

  /* ---------------------------------------------------------------
     STICKY MOBILE CTA — slides up after hero, hides near pricing.
     --------------------------------------------------------------- */
  function initStickyCta() {
    const bar = document.getElementById("sticky-cta");
    if (!bar) return;
    const hero    = document.querySelector(".hero");
    const pricing = document.getElementById("pricing");
    if (!hero) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const scrollY       = window.scrollY;
        const heroBottom    = hero.getBoundingClientRect().bottom + scrollY;
        const pricingTop    = pricing ? pricing.getBoundingClientRect().top + scrollY : Infinity;
        const pastHero      = scrollY > heroBottom - 80;
        const nearPricing   = scrollY >= pricingTop - 120;
        bar.classList.toggle("is-visible", pastHero && !nearPricing);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load
  }

  function init() { wireCtas(); initYear(); initGpuChip(); initCountUp(); }



  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
