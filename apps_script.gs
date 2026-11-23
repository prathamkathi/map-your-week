/**
 * Map your week · Google Apps Script backend
 * Paste this whole file into Extensions → Apps Script of your Google Sheet.
 * See SETUP.md for the 5 steps.
 *
 * Tabs it creates by itself:
 *   Responses  one row per person (updated, not duplicated, if they finish again)
 *   Events     "start" and "step_N" drop-off events (no answers)
 *   Referrals  live count of responses per referral code
 */

const RESPONSE_HEADERS = [
  'timestamp', 'name', 'home', 'office', 'college', 'gender', 'age', 'saturday', 'saturday_type',
  'call', 'phone', 'seconds_on_clock', 'my_ref_code', 'referred_by_code', 'map_contact', 'device', 'session_id',
  'source', 'total_secs',   // where they came from, and real time taken (the on-screen clock pauses while typing)
  'college_group',          // the tapped button: IIT, DU, NIT, IIIT, BITS, IIM or Other
  'age_exact'               // the typed age (the bracket is in 'age')
];
// events: start, step_1…step_9, share_click (detail = gang / friend)
const EVENT_HEADERS = ['timestamp', 'session_id', 'event', 'referred_by_code', 'device', 'source', 'detail'];

/* ---------- receive data from the form ---------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.type === 'event') addEvent_(data);
    else if (data.type === 'response') upsertResponse_(data);
    else if (data.type === 'map_contact') setMapContact_(data);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* not held */ }
  }
}

/* ---------- leaderboard: college counts only (no names, no numbers) ---------- */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'colleges';
  if (action !== 'colleges') return json_({ ok: false, error: 'unknown action' });
  const sh = sheet_('Responses', RESPONSE_HEADERS);
  const col = RESPONSE_HEADERS.indexOf('college') + 1;
  const last = sh.getLastRow();
  const counts = {};
  const labels = {};
  if (last > 1) {
    sh.getRange(2, col, last - 1, 1).getValues().forEach(function (r) {
      const name = String(r[0] || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      if (!labels[key]) labels[key] = name;
    });
  }
  const colleges = Object.keys(counts)
    .map(function (k) { return { college: labels[k], count: counts[k] }; })
    .sort(function (a, b) { return b.count - a.count; });
  return json_({ ok: true, total: Math.max(0, last - 1), colleges: colleges });
}

/* ---------- helpers ---------- */
function addEvent_(d) {
  const sh = sheet_('Events', EVENT_HEADERS);
  sh.appendRow(EVENT_HEADERS.map(function (h) { return h === 'timestamp' ? new Date() : clean_(d[h]); }));
}

function upsertResponse_(d) {
  const sh = sheet_('Responses', RESPONSE_HEADERS);
  ensureReferrals_();
  const row = RESPONSE_HEADERS.map(function (h) {
    if (h === 'timestamp') return new Date();
    if (h === 'seconds_on_clock' || h === 'total_secs') return Number(d[h]) || '';
    return clean_(d[h]);
  });
  const r = findRowByRef_(sh, d.my_ref_code);
  if (r) {
    // same person finished again (went back and changed something): update their row
    const mapCol = RESPONSE_HEADERS.indexOf('map_contact');
    if (!row[mapCol]) row[mapCol] = sh.getRange(r, mapCol + 1).getValue();
    sh.getRange(r, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
}

function setMapContact_(d) {
  const sh = sheet_('Responses', RESPONSE_HEADERS);
  const r = findRowByRef_(sh, d.my_ref_code);
  if (r) sh.getRange(r, RESPONSE_HEADERS.indexOf('map_contact') + 1).setValue(clean_(d.map_contact));
}

function findRowByRef_(sh, ref) {
  ref = String(ref || '').trim();
  const last = sh.getLastRow();
  if (!ref || last < 2) return 0;
  const col = RESPONSE_HEADERS.indexOf('my_ref_code') + 1;
  const vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]) === ref) return i + 2;
  return 0;
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Referrals tab: responses per referred_by_code (+ who owns that code). Created once. */
function ensureReferrals_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Referrals')) return;
  const sh = ss.insertSheet('Referrals');
  const refCol = colLetter_(RESPONSE_HEADERS.indexOf('referred_by_code') + 1);   // N
  const myCol = colLetter_(RESPONSE_HEADERS.indexOf('my_ref_code') + 1);         // M
  const lastCol = colLetter_(RESPONSE_HEADERS.length);                            // Q
  sh.getRange('A1').setFormula(
    '=QUERY(Responses!A:' + lastCol + ',"select ' + refCol + ', count(A) where ' + refCol + ' <> \'\' group by ' + refCol +
    ' order by count(A) desc label ' + refCol + ' \'referred_by_code\', count(A) \'responses\'",1)'
  );
  sh.getRange('C1').setValue('referrer_name');
  sh.getRange('C2').setFormula('=ARRAYFORMULA(IF(A2:A="",,IFERROR(VLOOKUP(A2:A,{Responses!' + myCol + ':' + myCol + ',Responses!B:B},2,FALSE),"")))');
  sh.getRange('D1').setValue('rank');
  sh.getRange('D2').setFormula('=ARRAYFORMULA(IF(A2:A="",,ROW(A2:A)-1))');
  sh.getRange('A1:D1').setFontWeight('bold');
  sh.setFrozenRows(1);
}

/** Run once from the editor (▶ setup) to create all three tabs before the first response. */
function setup() {
  sheet_('Responses', RESPONSE_HEADERS);
  sheet_('Events', EVENT_HEADERS);
  ensureReferrals_();
}

function clean_(v) {
  if (v === null || v === undefined) return '';
  let s = String(v).trim().slice(0, 300);
  if (/^[=+\-@]/.test(s)) s = "'" + s;   // stop formulas, keep +91 numbers as text
  return s;
}

function colLetter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
