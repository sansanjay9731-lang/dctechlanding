# DC Tech — GPU-Accelerated AI Infrastructure (landing page)

A single-page, ad-driven **qualify-then-sell** funnel for DC Tech's *GPU-Accelerated AI
Infrastructure* practitioner training, aimed at skeptical infrastructure engineers.
Static HTML/CSS/vanilla-JS — no framework, no build step. Deploy target: **Vercel (static)**.

**Funnel:** Hero CTA → **Readiness Quiz** (Google Form) → *pass* routes to **Checkout
($199)**, *brush up* routes to **`reading-list.html`**. The pass/brush-up routing is
configured inside the Google Form (response-based redirect), not on this page — this
page launches the quiz and the checkout, and forwards UTM params so attribution
survives the redirect.

```
dctech-nvidia-landing/
├── index.html            # the landing page (full dark "engineering" mode)
├── reading-list.html     # brush-up reading list (quiz non-passers land here)
├── styles.css            # dark design system (both pages share it)
├── script.js             # UTM capture + forwarding · CTA wiring · reveal
├── assets/
│   ├── dctech-logo.png   # brand logo (swap this file to rebrand)
│   └── favicon.ico
├── apps-script/Code.gs   # OPTIONAL legacy lead-capture pipeline (see below)
└── README.md
```

## Visual system

Full **dark engineering** aesthetic — palette ramp + elevation recipe derived from
Linear / Railway / Oxide, with the DC Tech blue as the single accent.

| Token | Value | Use |
|------|-------|-----|
| `--bg` | `#0A0C12` | page base (tinted near-black) |
| `--surface-1` / `--surface-2` | `#11141C` / `#171B25` | cards / raised |
| `--border` | `rgba(255,255,255,.08)` | hairline borders (+ `inset 0 1px 0` top highlight) |
| `--accent` / `--accent-text` | `#2563EB` / `#7CB0FF` | CTAs / links + text on dark |
| Font | **Geist** + **Geist Mono** | sans for prose; **mono used as an accent only** |

**Mono rule:** headlines and body are sans; mono (Geist Mono) is reserved for eyebrows
(`// label`), stat numbers, badges, the terminal block, module tags, and spec rows —
the register that reads "built by infrastructure people" without looking gimmicky.
(If you want the big section headings in mono too, it's a one-line change — ask.)

## The swappable knobs

1. **Logo** — replace `assets/dctech-logo.png`.
2. **Colours** — the `:root` tokens at the top of `styles.css`.
3. **Funnel URLs** — the `CONFIG` block at the top of `script.js`:
   - `QUIZ_URL` — Readiness Quiz Google Form URL
   - `CHECKOUT_URL` — Stripe / checkout URL for the $199 enrolment
   - `SYLLABUS_PDF_URL` — full syllabus PDF
   - `READING_LIST_URL` — already wired to `reading-list.html`
4. **Copy** — all in `index.html` / `reading-list.html`.

While `QUIZ_URL` / `CHECKOUT_URL` / `SYLLABUS_PDF_URL` are `TODO`, the page still works:
each CTA **falls back to its in-page anchor** (e.g. the quiz buttons scroll to the
qualification-gate section) so nothing 404s during preview, and a console warning lists
what's still pending.

## Wiring the Google Form quiz (rashmi)

1. Build the Readiness Quiz as a Google Form (make it a Quiz so it can score).
2. Form → **Settings → make it a quiz**; add a passing-score branch, OR use
   **response-based section routing** to send high scorers to a "you're ready" section
   that links to `CHECKOUT_URL`, and others to a section linking to `reading-list.html`.
   (Google Forms can't auto-redirect on score alone — the simplest robust setup is two
   end sections with the two links; or use the confirmation-message link.)
3. Put the Form's share URL into `script.js → QUIZ_URL`.
4. Put the Stripe payment link into `CHECKOUT_URL`.
5. Deploy `reading-list.html` (already built) — it's the brush-up target.

> UTM forwarding: `script.js` appends any `utm_*` from the page URL onto `QUIZ_URL`,
> `CHECKOUT_URL` and the reading-list link, so an ad click → quiz → checkout chain stays
> attributed. For Google Forms *field* prefill you'd map `entry.<id>` params instead;
> the appended `utm_*` are harmless and still readable in the response URL / analytics.

## UTM tracking

On load, `script.js` snapshots `utm_source, utm_medium, utm_campaign, utm_content,
utm_term` and forwards them on every outbound CTA. Test:
`index.html?utm_source=google&utm_medium=cpc&utm_campaign=gpu_infra_india` → inspect a
CTA's `href`.

## Optional: legacy lead-capture pipeline

`apps-script/Code.gs` is the verified **Google Sheets lead-capture** web app from the
earlier lead-form version of this page. It is **not wired into the current quiz/checkout
funnel**. Keep it if you later want a "Request callback" fallback form (the Form quiz
already captures contact info + score into Sheets natively, so most setups won't need
it). Deploy steps are in the file's header comment.

## Deploy to Vercel

Static — no config. Either `vercel --prod` from this folder, or import the repo in the
Vercel dashboard (Framework preset: **Other**, no build command, output = root). Both
`index.html` and `reading-list.html` ship as static pages.

## Open TODOs

- **TODO(rashmi):** `QUIZ_URL`, `CHECKOUT_URL`, `SYLLABUS_PDF_URL` in `script.js`; wire the Form's pass/brush-up routing.
- **TODO(pricing):** `$199 USD` is shown verbatim per the brief — confirm currency localisation for the India / UK markets before go-live (`index.html`, `.price__amount`).
- **TODO(domain):** final domain/URL — update `<meta property="og:*">` + footer when set.
- **Content claims** ("218 pages", "3 case studies", BoM for DGX/Cisco/Dell-HPE, certification) are taken verbatim from your brief — make sure the product delivers them before running ads.
