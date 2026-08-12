/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DC TECH — LEAD CAPTURE  ·  Google Apps Script web app (Sheet-bound)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DEPLOY STEPS:
 *   1. Open the target Google Sheet → Extensions → Apps Script.
 *   2. Paste this file (replace any default Code.gs contents).
 *   3. Deploy → New deployment → type: "Web app".
 *        - Description:      "DC Tech lead capture v1"
 *        - Execute as:       Me  (your account)
 *        - Who has access:   Anyone   ← required so the public page can POST
 *   4. Click Deploy, authorize when prompted, copy the "/exec" Web app URL.
 *   5. Paste that URL into script.js → SHEETS_ENDPOINT.
 *   6. Health check: open the /exec URL in a browser → should return
 *        {"status":"ok","service":"dctech-lead-capture"}   (that's doGet).
 *
 *   NOTE: after ANY code change you must re-deploy a NEW VERSION
 *         (Manage deployments → edit → Version: New version) or the live URL
 *         keeps serving the OLD code.
 *
 * TODO(rashmi): confirm the TARGET SHEET (tab name below) and the EXACT COLUMN
 *               ORDER before go-live. Order is defined once in HEADERS and the
 *               row is assembled to match it 1:1.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO(rashmi): set to the exact tab name leads should land in. "" = first/active sheet.
var TARGET_SHEET_NAME = "Leads";

// EXACT column order. Frontend body field names must match keys 'name'..'utm_term'.
var HEADERS = [
  "timestamp",
  "name",
  "email",
  "phone",
  "country",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return TARGET_SHEET_NAME
    ? (ss.getSheetByName(TARGET_SHEET_NAME) || ss.insertSheet(TARGET_SHEET_NAME))
    : ss.getSheets()[0];
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Health check — open the /exec URL in a browser to hit this.
function doGet(e) {
  return jsonOut_({ status: "ok", service: "dctech-lead-capture" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30s for other appends to finish — prevents concurrent-row races.
  lock.waitLock(30000);
  try {
    // Form-encoded POST → Apps Script exposes fields as e.parameter (last value per key).
    var p = (e && e.parameter) ? e.parameter : {};
    var sheet = getSheet_();

    // Ensure a header row exists if the sheet is empty.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var row = [
      new Date(),            // timestamp (server-side, authoritative)
      p.name      || "",
      p.email     || "",
      p.phone     || "",
      p.country   || "",
      p.utm_source   || "",
      p.utm_medium   || "",
      p.utm_campaign || "",
      p.utm_content  || "",
      p.utm_term     || ""
    ];

    sheet.appendRow(row);

    // Response is NOT readable by the browser under no-cors (Apps Script issues a
    // cross-origin redirect), but it's useful for direct/curl testing.
    return jsonOut_({ result: "success" });
  } catch (err) {
    return jsonOut_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}
