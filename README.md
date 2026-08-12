# DC Tech — NVIDIA AI Infrastructure Training (landing page)

A single-page, ad-driven lead-capture funnel for DC Tech Consulting's *NVIDIA AI
Infrastructure Training*. Static HTML/CSS/vanilla-JS — no framework, no build step.
Deploy target: **Vercel (static)**. Leads write directly to **Google Sheets** via a
Google Apps Script web app.

```
dctech-nvidia-landing/
├── index.html            # the page
├── styles.css            # design system + layout (mobile-first)
├── script.js             # UTM capture · contact links · reveal · lead form
├── assets/
│   ├── dctech-logo.png   # brand logo (swap this file to rebrand)
│   └── favicon.ico
├── apps-script/Code.gs   # paste into the Sheet-bound Apps Script project
└── README.md
```

## Brand

Palette + type pulled from **dctech.cloud**:

| Token | Value | Use |
|------|-------|-----|
| `--brand-600` | `#2563EB` | primary brand blue / CTAs |
| `--brand-400` | `#60A5FA` | kicker labels, hero accent |
| `--cyan-500`  | `#06B6D4` | gradient / glow accent |
| Dark hero     | `#060B1A → #0A1124` navy | hero, strip, footer |
| Font          | **Geist** + Geist Mono | headings, body, mono numerals |

Section rhythm mirrors the reference site: **small-caps kicker → bold headline (one
accent word) → muted supporting line**, on an 8px spacing scale.

## The 4 swappable knobs

Everything you need to edit at go-live lives in two files:

1. **Logo** — replace `assets/dctech-logo.png`.
2. **Colours** — the `:root` tokens at the top of `styles.css`.
3. **Endpoint + contact** — the `CONFIG` block at the top of `script.js`:
   - `SHEETS_ENDPOINT` — Apps Script `/exec` URL
   - `WHATSAPP_NUMBER` / `CALL_NUMBER` — intl-format numbers
4. **Copy** — all in `index.html`.

While `WHATSAPP_NUMBER` / `CALL_NUMBER` / `SHEETS_ENDPOINT` are left as `TODO`, the
page still works: WhatsApp/Call links fall back to scrolling to the form, and form
submits succeed as a no-op (with a console warning) so previews aren't blocked.

## Google Sheets pipeline (Apps Script)

The frontend POSTs as `application/x-www-form-urlencoded` so the request stays a CORS
*simple request* — **no OPTIONS preflight** (Apps Script can't answer preflights).
Apps Script returns a cross-origin 302 whose body JS can't read, so the live send is
`mode:"no-cors"` fire-and-forget — **the Sheet row is the source of truth**.

Row columns (exact order): `timestamp, name, email, phone, country, utm_source,
utm_medium, utm_campaign, utm_content, utm_term`.

### Deploy + verify (do this before go-live)

1. Open the target Sheet → **Extensions → Apps Script**, paste `apps-script/Code.gs`.
2. Set `TARGET_SHEET_NAME` to the real tab. **TODO(rashmi): confirm existing sheet vs
   new, and the exact column order.**
3. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone*.
   Authorize, copy the `/exec` URL.
4. Health check — open `/exec` in a browser → `{"status":"ok","service":"dctech-lead-capture"}`.
5. Prove a row lands (the one check that can't be done locally):
   ```bash
   curl -L -X POST '<EXEC_URL>' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     --data 'name=Test&email=t@t.com&phone=+910000000000&country=India&utm_source=manual'
   # → {"result":"success"} and a new row appears in the Sheet
   ```
6. Paste the `/exec` URL into `script.js → SHEETS_ENDPOINT`, deploy to Vercel, submit
   the real form, confirm the row. Re-deploy a **new version** after any `.gs` edit.

> **Verified locally:** the form-encoded body parses into the exact `e.parameter` keys
> the script reads, in the correct column order (mock-server round-trip).
> **Not verifiable without your Google account:** the live `appendRow` write — step 5
> above is the go-live gate.

## UTM tracking

On load, `script.js` snapshots `utm_source, utm_medium, utm_campaign, utm_content,
utm_term` from the URL and includes them in every submission. Test:
`index.html?utm_source=google&utm_medium=cpc&utm_campaign=nvidia_india`.

## Deploy to Vercel

Static — no config needed. Either:
- `vercel` (or `vercel --prod`) from this folder, or
- import the repo in the Vercel dashboard (Framework preset: **Other**, no build command,
  output = root).

## Open TODOs

- **TODO(rashmi):** target Sheet (existing vs new) + exact column order; WhatsApp + call numbers.
- **TODO(pricing):** currently "Pricing shared on your callback" — no hardcoded price. Swap if a price is approved.
- **TODO(domain):** final domain/URL — update `<meta property="og:*">` + footer when set.
