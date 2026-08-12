/* =================================================================
   DC Tech — NVIDIA AI Infrastructure Training
   Vanilla JS: UTM capture · contact links · reveal-on-scroll · lead form.
   ================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     CONFIG — the swappable knobs. Edit these three, nothing else.
     --------------------------------------------------------------- */

  // Apps Script web app /exec URL. See apps-script/Code.gs for deploy steps.
  const SHEETS_ENDPOINT = "TODO(rashmi): paste Apps Script web app URL here";

  // Contact channels. Use full international format, digits only for WhatsApp.
  // While these are TODO, the WhatsApp/Call links gracefully fall back to the form.
  const WHATSAPP_NUMBER = "TODO(rashmi): WhatsApp number, intl digits only e.g. 919999999999";
  const CALL_NUMBER     = "TODO(rashmi): phone number, intl format e.g. +919999999999";
  const WHATSAPP_PREFILL = "Hi DC Tech — I'd like to know more about the NVIDIA AI Infrastructure Training.";

  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  /* ---------------------------------------------------------------
     UTM CAPTURE — snapshot once on load so every lead is attributed.
     --------------------------------------------------------------- */
  const UTMS = (function readUtms() {
    const qs = new URLSearchParams(location.search);
    const out = {};
    UTM_KEYS.forEach((k) => { out[k] = qs.get(k) || ""; });
    return out;
  })();

  /* ---------------------------------------------------------------
     CONTACT LINKS — wire WhatsApp + click-to-call from the constants.
     Falls back to scrolling to the form if a number is still a TODO.
     --------------------------------------------------------------- */
  const isTodo = (v) => /^TODO/.test(v);

  function wireContactLinks() {
    const waReady = !isTodo(WHATSAPP_NUMBER);
    const callReady = !isTodo(CALL_NUMBER);

    document.querySelectorAll(".js-whatsapp").forEach((a) => {
      if (waReady) {
        const num = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
        a.href = `https://wa.me/${num}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;
        a.target = "_blank"; a.rel = "noopener";
      } else {
        a.href = "#lead"; // graceful fallback until the number is set
      }
    });

    document.querySelectorAll(".js-call").forEach((a) => {
      a.href = callReady ? `tel:${CALL_NUMBER.replace(/\s+/g, "")}` : "#lead";
    });
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
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
     LEAD FORM — validate, honeypot, POST to Apps Script, states.
     --------------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+]?[\d\s\-().]{7,20}$/;

  const VALIDATORS = {
    name:    (v) => (v.trim() ? "" : "Please enter your name."),
    email:   (v) => (EMAIL_RE.test(v.trim()) ? "" : "Please enter a valid email address."),
    phone:   (v) => (PHONE_RE.test(v.trim()) ? "" : "Please enter a valid phone number."),
    country: (v) => (v ? "" : "Please select your country."),
  };

  function initLeadForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;

    const card = form.closest(".form__card");
    const successEl = document.getElementById("lead-success");
    const errorEl = document.getElementById("lead-error");
    const retryBtn = document.getElementById("lead-retry");
    const submitBtn = form.querySelector('button[type="submit"]');

    const show = (el) => { if (el) el.hidden = false; };
    const hide = (el) => { if (el) el.hidden = true; };

    function setFieldError(name, msg) {
      const field = form.elements[name] ? form.elements[name].closest(".field") : null;
      const errEl = form.querySelector(`[data-error-for="${name}"]`);
      if (field) field.classList.toggle("is-invalid", !!msg);
      if (errEl) {
        errEl.textContent = msg || "";
        errEl.hidden = !msg;
      }
      const input = form.elements[name];
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function validateAll() {
      let firstInvalid = null;
      Object.keys(VALIDATORS).forEach((name) => {
        const value = form.elements[name] ? form.elements[name].value : "";
        const msg = VALIDATORS[name](value);
        setFieldError(name, msg);
        if (msg && !firstInvalid) firstInvalid = form.elements[name];
      });
      return firstInvalid;
    }

    // Clear a field's error as the user fixes it.
    Object.keys(VALIDATORS).forEach((name) => {
      const input = form.elements[name];
      if (input) {
        input.addEventListener("input", () => {
          if (input.closest(".field").classList.contains("is-invalid")) {
            setFieldError(name, VALIDATORS[name](input.value));
          }
        });
        if (input.tagName === "SELECT") {
          input.addEventListener("change", () => setFieldError(name, VALIDATORS[name](input.value)));
        }
      }
    });

    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        hide(errorEl);
        form.hidden = false;
        const nameInput = form.elements["name"];
        if (nameInput) nameInput.focus();
      });
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      hide(errorEl);

      // Honeypot: a real user never fills "website". If filled, a bot did —
      // silently show success WITHOUT sending anything.
      const honeypot = form.elements["website"] ? form.elements["website"].value : "";
      if (honeypot.trim() !== "") {
        form.hidden = true;
        show(successEl);
        return;
      }

      const firstInvalid = validateAll();
      if (firstInvalid) { firstInvalid.focus(); return; }

      // Build an application/x-www-form-urlencoded body (URLSearchParams).
      // WHY: this keeps the request a CORS "simple request" (POST + form-encoded
      // Content-Type + no custom headers), so the browser sends it with NO
      // OPTIONS preflight — Apps Script doesn't answer preflights. Apps Script
      // reads each field from e.parameter on the server.
      const body = new URLSearchParams({
        name:    form.elements["name"].value.trim(),
        email:   form.elements["email"].value.trim(),
        phone:   form.elements["phone"].value.trim(),
        country: form.elements["country"].value,
        website: "", // honeypot (already passed the bot check above)
        ...UTMS,
      });

      setLoading(true);
      const ok = await sendLead(body);
      setLoading(false);

      if (ok) {
        form.hidden = true;
        show(successEl);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        if (successEl) successEl.focus?.();
      } else {
        show(errorEl);
        if (errorEl) errorEl.focus?.();
      }
    });

    function setLoading(on) {
      if (!submitBtn) return;
      submitBtn.classList.toggle("is-loading", on);
      submitBtn.disabled = on;
    }
  }

  /**
   * Send the lead to Apps Script.
   *
   * Apps Script returns a 302 redirect to script.googleusercontent.com with no
   * CORS headers, so JS can never read the {result:"success"} body cross-origin.
   * The robust path is mode:"no-cors", fire-and-forget: the request DOES reach
   * the server and the row IS written; we just can't read the opaque response.
   * The Sheet row is the source of truth.
   *
   * We still TRY a readable request first (works against a same-origin proxy or
   * the local mock during testing); on the expected cross-origin failure we fall
   * back to no-cors. A no-cors send that doesn't throw is treated as success.
   */
  async function sendLead(body) {
    if (isTodo(SHEETS_ENDPOINT)) {
      console.warn("[DC Tech] SHEETS_ENDPOINT is not set — see apps-script/Code.gs. Treating submit as a no-op success for preview.");
      return true; // preview mode: don't block the user while the endpoint is pending
    }

    // (a) Readable attempt (testing / same-origin proxy).
    try {
      const res = await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
      });
      if (res.ok) {
        const text = await res.text();
        try { if (JSON.parse(text).result === "success") return true; } catch (_) {}
      }
    } catch (_) { /* cross-origin redirect blocked — fall through */ }

    // (b) Recommended live path: no-cors fire-and-forget.
    try {
      await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
      });
      return true;
    } catch (_) {
      return false; // genuine network failure
    }
  }

  /* ---------------------------------------------------------------
     Misc — current year.
     --------------------------------------------------------------- */
  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------------
     Boot.
     --------------------------------------------------------------- */
  function init() {
    wireContactLinks();
    initReveal();
    initLeadForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
