/* Map your week · one question at a time. Plain JS, no build step. */
(() => {
'use strict';

/* ───────── config + environment ───────── */
const CFG = {
  script: typeof SCRIPT_URL === 'string' ? SCRIPT_URL.trim() : '',
  leaderboard: typeof LEADERBOARD !== 'undefined' && !!LEADERBOARD,
  site: typeof SITE_URL === 'string' ? SITE_URL.trim() : ''
};
const params = new URLSearchParams(location.search);
const HOLD = params.has('hold');                       // dev only: reaction screens wait for a tap
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const $ = (s, r = document) => r.querySelector(s);
// Nicer line breaks: an emoji never starts a line on its own, and a short last word never sits alone.
const EMO_RE = /\s+((?:\p{Extended_Pictographic}|\p{Regional_Indicator})[\p{Extended_Pictographic}\u200d\ufe0f\u{1F3FB}-\u{1F3FF}]*)/gu;
const nice = t => {
  t = String(t ?? '').replace(EMO_RE, '\u00A0$1');
  return t.replace(/ ([^ ]{1,10})$/u, '\u00A0$1');
};
// question headings: \n = a planned line break; "9-to-5" style phrases never split at the hyphen
const headline = t => esc(nice(t)).replace(/\n/g, '<br>').replace(/(\(?\d+-to-\d+\)?)/g, '<span class="nw">$1</span>');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rand = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => ALPH[x % ALPH.length]).join('');
const store = {
  get(k) { try { return localStorage.getItem('mapweek:' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('mapweek:' + k, v); } catch (e) { /* private mode */ } }
};

/* referral: ?r=CODE on arrival */
// Codes this phone has already handed out (so opening your own link doesn't count as a referral)
const OWN_REFS = (store.get('own_refs') || store.get('my_ref') || '').split(',').filter(Boolean);
const rIn = (params.get('r') || '').trim().toUpperCase();
if (/^[A-Z0-9]{4,10}$/.test(rIn) && !OWN_REFS.includes(rIn)) store.set('ref_by', rIn);
const REF_BY = OWN_REFS.includes(store.get('ref_by') || '') ? '' : (store.get('ref_by') || '');
const SESSION = rand(12);
// A fresh code for every fill. Two people on one phone must never share a code,
// because the Sheet updates the row that has the same code (that used to overwrite the first person).
const MY_REF = rand(6);

/* ───────── copy (final) ───────── */
const AGE = {
  'Under 22': { e: '🔥', cp: '1f525', h: 'Garam khoon hai abhi toh!', s: 'The world better be ready 💪' },
  '22–24': { e: '🧑‍💼', cp: '1f9d1_200d_1f4bc',   // 🫡 gets cut off on some Apple emoji fonts
    h: 'Fresh out of college and already adulting.', s: 'Respect' },
  '25–26': { e: '😎', cp: '1f60e', h: 'The sweet spot ✨', s: 'You know the city, and the city knows you' },
  '27–30': { e: '🌟', cp: '1f31f', h: 'Settled, sorted, and still up for something new.', s: 'Best combo 👌' },
  '31+': { e: '🤗', cp: '1f917', h: "Our crowd's on the younger side right now 🌱", s: "but good company has no age limit. Glad you're here" }
};
const SAT = [
  { e: '🥞', l: 'Brunch with friends', type: 'Brunch Diplomat', line: 'Fixes friendships, plans trips, all before the eggs arrive.', r: { e: '🥞', cp: '1f95e', h: 'Excellent taste.', s: 'Pancakes approve' } },
  { e: '🥾', l: 'Out in nature', type: 'Trail Philosopher', line: 'Thinks best with a little mud on the shoes.', r: { e: '🌿', cp: '1f33f', h: 'Fresh air over fresh notifications.', s: 'Love it' } },
  { e: '🏸', l: 'Sports or games', type: 'Weekend Competitor', line: 'Rest days are just warm-ups for the rematch.', r: { e: '🏆', cp: '1f3c6', h: 'A competitor, noted.', s: "We'll keep score" } },
  { e: '🛋️', l: 'Netflix and nap', type: 'Professional Recharger', line: "Doing nothing, beautifully. Honestly, it's a skill.", r: { e: '😴', cp: '1f634', h: 'The most honest answer here.', s: 'Zero judgement' } },
  { e: '🎶', l: 'Gigs and nightlife', type: 'Night Owl Socialite', line: 'Knows the bassline and the bouncer by name.', r: { e: '🪩', cp: '1faa9', h: 'Saturday night energy.', s: 'Respect the plan' } },
  { e: '📚', l: 'Learning something new', type: 'Curious Collector', line: 'Fourteen tabs open, every single one fascinating.', r: { e: '🧠', cp: '1f9e0', h: 'Curious mind.', s: 'The best kind' } }
];
const CALL = [
  { v: "Sure, let's talk", yes: true, r: { e: '🥳', cp: '1f973', h: 'Yay, you just made my day!', s: "I'm building better weekends for young grads in NCR. You'll help shape it 🛠️" } },
  { v: "I'll pass", r: { e: '🙌', cp: '1f64c', h: 'Totally fine.', s: 'Thanks for the minute you already gave 💛' } }
];
const OTHER = 'Somewhere else ✍️';
const OTHER_IIT = 'Other IIT';
const ANOTHER_IIT = 'Another IIT ✍️';
const IITS = ['IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT (BHU) Varanasi', ANOTHER_IIT];
const SAT_OTHER = 'Something else';
const SAT_CUSTOM = { e: '✨', defaultType: 'Original Weekender', r: { e: '🤩', cp: '1f929', h: "Now that's a Saturday.", s: 'Your own thing. Love that' } };
const ORDER = ['name', 'home', 'office', 'college', 'gender', 'age', 'saturday', 'call', 'phone'];
const Q = {
  name: { n: 1, kind: 'text', q: 'First things first:\nwhat should I call you? 🙋', ph: 'Your name', ac: 'name', max: 40, live: true, cap: 'words' },
  home: { n: 2, kind: 'text', q: 'Which area do you call home? 🏡', help: 'Sector or locality + city. Like Sector\u00A056, Gurgaon', ac: 'off', max: 80, cap: 'words' },
  office: { n: 3, kind: 'text', q: 'And where does the 9-to-5 (or\u00A09-to-9) happen? 💼', help: 'Office area + city. Or just type "WFH"', ac: 'off', max: 80, cap: 'words' },
  college: { n: 4, kind: 'choice', clock: true, grid: true, q: 'Where did you do your undergrad? 🎓', opts: ['IIT Delhi', 'Other IIT', 'DU', 'DTU', 'NSUT', 'IIIT Delhi', OTHER] },
  gender: { n: 5, kind: 'choice', clock: true, q: 'You are… 🙂', opts: ['Woman', 'Man', 'Non-binary', 'Prefer not to say'], emo: ['👩', '👨', '🧑', '🤐'] },
  age: { n: 6, kind: 'choice', clock: true, q: 'And your age? 🎂', opts: Object.keys(AGE) },
  saturday: { n: 7, kind: 'tiles', clock: true, q: 'Be honest:\nyour ideal Saturday looks like… 😌', opts: [...SAT.map(s => s.l), SAT_OTHER] },
  call: { n: 8, kind: 'choice', q: 'Last real question:\ncan I borrow 10\u00A0minutes to hear about your weekends? 🎉', help: 'Just a phone call 📞 No sales, and we stop whenever you want.', opts: CALL.map(c => c.v) },
  phone: { n: 9, kind: 'tel', q: 'Where can I reach you? 📱', help: 'Only for this call. Only we see it. No spam 🤞', ph: '10-digit mobile number', ac: 'tel', max: 16 }
};
const T = {
  empty: 'Type an answer to continue',
  short: "That number looks short. 10 digits, please",
  long: "That's a few digits too many. Just your 10-digit mobile number",
  phoneStart: 'Mobile numbers start with 6, 7, 8 or 9',
  phoneBad: "That number doesn't look right",
  paused: '⏸️ Clock paused. Take your time',
  ticking: "⏱️ Clock's ticking",
  progress: n => n <= 3 ? 'Just getting started' : n <= 6 ? 'Halfway there ☕' : 'Almost there'
};

/* ───────── state ───────── */
const A = { name: '', home: '', office: '', college: '', collegeOther: '', iitOther: '', satOther: '', satType: '', gender: '', age: '', saturday: '', call: '', phone: '' };
const hist = ['welcome'];
let cur = 'welcome';          // current question / screen id
let inReaction = null;        // question id whose reaction is showing
let reactTimer = 0, reactCont = null, reactEnd = 0, reactLeft = 0;
let otherOpen = false;         // a type-in box is open on a tap screen (clock pauses)
let screenBack = null;        // a screen can handle Back itself (e.g. IIT list → all colleges)
let finalSecs = 0;
let mapContact = '';
const stepsSent = new Set();

/* ───────── clock (runs only on quick-tap screens) ───────── */
const clock = {
  ms: 0, on: false, t0: 0,
  start() { if (!this.on) { this.on = true; this.t0 = performance.now(); } },
  stop() { if (this.on) { this.ms += performance.now() - this.t0; this.on = false; } },
  read() { return this.ms + (this.on ? performance.now() - this.t0 : 0); }
};
const shouldTick = () => !inReaction && !!(Q[cur] && Q[cur].clock) && !otherOpen && !document.hidden;
const chip = $('#chip'), chipline = $('#chipline');
let chipState = null, chipIv = 0;
const fmt = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function syncClock() {
  shouldTick() ? clock.start() : clock.stop();
  // The clock runs quietly (tap questions only). It is never shown; only the end screen says the seconds.
  chipline.hidden = true;
  const showChip = false;
  if (!showChip) return;
  const st = clock.on ? 'tick' : 'pause';
  if (st !== chipState) {
    chipState = st;
    chip.className = 'chip ' + (st === 'tick' ? 'tick' : 'pause');
    chip.innerHTML = st === 'tick' ? `${T.ticking} <span class="t" aria-hidden="true">${fmt(clock.read())}</span>` : T.paused;
    void chip.offsetWidth; chip.classList.add('swap');
  }
  clearInterval(chipIv);
  if (clock.on) chipIv = setInterval(() => { const t = $('.t', chip); if (t) t.textContent = fmt(clock.read()); }, 250);
}
let resumeOnShow = false;
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('tab-hidden', document.hidden);
  if (document.hidden) { resumeOnShow = clock.on; clock.stop(); }
  else if (resumeOnShow) syncClock();
  // a reaction screen waits while the person is away, then gives them the rest of its time
  if (inReaction && reactCont && !HOLD) {
    if (document.hidden) { clearTimeout(reactTimer); reactLeft = Math.max(0, reactEnd - performance.now()); }
    else { reactEnd = performance.now() + reactLeft; reactTimer = setTimeout(reactCont, reactLeft); }
  }
});

/* ───────── data ───────── */
function post(obj) {
  if (!CFG.script) return;
  try {
    fetch(CFG.script, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(obj) }).catch(() => {});
  } catch (e) { /* never block the UI */ }
}
function device() {
  const ua = navigator.userAgent;
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const br = /SamsungBrowser/.test(ua) ? 'Samsung' : /Edg\//.test(ua) ? 'Edge' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Other';
  const inApp = /Instagram|FBAN|FBAV|WhatsApp|LinkedInApp/.test(ua) ? ' (in-app)' : '';
  return `${os} ${br}${inApp}`;
}
const DEVICE = device();
const event = name => post({ type: 'event', event: name, session_id: SESSION, referred_by_code: REF_BY, device: DEVICE, timestamp: new Date().toISOString() });

/* ───────── helpers ───────── */
const area = s => (String(s).split(',')[0] || '').trim() || String(s).trim();
const disp = s => String(s).trim().replace(/\s+/g, ' ').replace(/(^|[\s-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase());  // "pratham kathi" → "Pratham Kathi"
// Places: capitalise the first letter of every word ("sector 56, gurgaon" → "Sector 56, Gurgaon"); existing capitals stay (DLF, WFH)
const CAPS = new Set(['wfh', 'dlf', 'ncr', 'mg', 'huda', 'dda', 'iffco', 'iit', 'du', 'gk', 'jnu', 'cp', 'nit', 'iiit', 'dtu', 'nsut', 'ip', 'sez', 'it', 'bkc', 'ggn', 'blr']);
const placeCase = s => String(s).trim().replace(/\s+/g, ' ')
  .replace(/(^|[\s,\-\/(])(\p{Ll})/gu, (m, p, c) => p + c.toUpperCase())
  .replace(/\p{L}+/gu, w => CAPS.has(w.toLowerCase()) ? w.toUpperCase() : w);
const isWFH = s => /\b(wfh|remote(ly)?|work(ing)?\s*from\s*home|from\s*home|home\s*office)\b/i.test(s);
const digits = s => (String(s).match(/\d/g) || []).length;
/* phone: Indian mobile (10 digits, starts 6–9; +91 / 91 / 0 in front is fine). A number with another + country code is allowed too. */
function phoneCheck(raw) {
  const v = String(raw).trim(), d = v.replace(/\D/g, '');
  if (!d) return { err: T.empty };
  let m = d;
  if (v.startsWith('+') && !v.startsWith('+91')) return d.length >= 8 && d.length <= 15 ? { ok: '+' + d } : { err: T.phoneBad };
  if (m.length === 12 && m.startsWith('91')) m = m.slice(2);
  else if (m.length === 11 && m.startsWith('0')) m = m.slice(1);
  if (m.length < 10) return { err: T.short };
  if (m.length > 10) return { err: T.long };
  if (!/^[6-9]/.test(m)) return { err: T.phoneStart };
  return { ok: '+91 ' + m.slice(0, 5) + ' ' + m.slice(5) };
}
const phoneTyping = input => input.addEventListener('input', () => {   // only digits, spaces, - and a leading +
  const c = input.value.replace(/[^\d+\- ]/g, '').replace(/(?!^)\+/g, '');
  if (c !== input.value) input.value = c;
});
const buzz = () => { try { if (/Android/i.test(navigator.userAgent) && navigator.vibrate) navigator.vibrate(10); } catch (e) { /* ignore */ } };
const cleanType = t => { t = String(t || '').trim().replace(/^(i'?m\s+)?(a|an)\s+/i, ''); return t.replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase()); };
const satOf = () => SAT.find(s => s.l === A.saturday)
  || (A.saturday ? { e: SAT_CUSTOM.e, type: cleanType(A.satType) || SAT_CUSTOM.defaultType, line: `"${A.satOther}"` } : SAT[0]);
const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
const secWord = n => n === 1 ? 'second' : 'seconds';
const shareLink = () => (CFG.site || (location.origin + location.pathname.replace(/index\.html$/, ''))).replace(/\/+$/, '');
const shortLink = () => shareLink().replace(/^https?:\/\//, '');
const ICON_ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* emoji look: OpenMoji (static, outline style) everywhere, Google Noto animated on the big reaction emoji.
   Credit line for both is in the page footer (OpenMoji CC BY-SA 4.0, Noto Emoji CC BY 4.0). */
const ANIMATED_EMOJI = true;
// files live in site/emoji/ (downloaded once, free): om = OpenMoji SVGs, noto = Noto animated (Lottie JSON)
const OM_URL = hex => `emoji/om/${hex}.svg`;
const EMOJI_URL = cp => `emoji/noto/${cp}.json`;
const NOTO_HAVE = new Set('1f31f 1f33f 1f389 1f3c6 1f44b 1f49b 1f525 1f60e 1f634 1f64c 1f917 1f929 1f95e 1f973 1f979 1f9e0 1faa9'.split(' '));
const EMO_ONE = /(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])?(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])?)*)/gu;
const EMO_HAS = new RegExp(EMO_ONE.source, 'u');
const hexOf = (ch, keepVS) => [...ch].map(c => c.codePointAt(0)).filter(c => keepVS || c !== 0xfe0f).map(c => c.toString(16).toUpperCase()).join('-');
function omImg(ch) {
  const img = new Image();
  img.className = 'om'; img.alt = ch; img.draggable = false; img.decoding = 'async';
  img.onerror = () => img.replaceWith(document.createTextNode(ch));   // not in our set: the phone's own emoji
  img.src = OM_URL(hexOf(ch, false));
  return img;
}
function skin(root) {
  const nodes = [];
  if (root.nodeType === 3) nodes.push(root);
  else if (root.nodeType === 1) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) nodes.push(n); }
  nodes.forEach(n => {
    const t = n.nodeValue;
    if (!t || !EMO_HAS.test(t) || !n.parentElement || n.parentElement.closest('script,style,textarea,input,[data-cp],.pin')) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of t.matchAll(EMO_ONE)) {
      if (m.index > last) frag.append(t.slice(last, m.index));
      frag.append(omImg(m[0]));
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.append(t.slice(last));
    n.replaceWith(frag);
  });
}
new MutationObserver(recs => recs.forEach(r => {
  r.addedNodes.forEach(n => skin(n));
  if (r.type === 'characterData') skin(r.target);
})).observe(document.body, { childList: true, subtree: true, characterData: true });

/* big reaction emoji: Google's Noto animation (small Lottie file + lottie player); if slow or missing, the OpenMoji one */
const animCache = new Map();
function loadEmoji(cp) {
  if (!ANIMATED_EMOJI || !cp || !NOTO_HAVE.has(cp) || reduced()) return null;
  if (!animCache.has(cp)) {
    const p = fetch(EMOJI_URL(cp)).then(r => { if (!r.ok) throw 0; return r.json(); });
    p.catch(() => {});
    animCache.set(cp, p);
  }
  return animCache.get(cp);
}
const lottieReady = () => new Promise((res, rej) => {
  const t0 = Date.now();
  (function wait() { if (window.lottie) res(window.lottie); else if (Date.now() - t0 > 2500) rej(); else setTimeout(wait, 60); })();
});
let anims = [];
function animoji(scope) {
  anims = anims.filter(a => { if (a.wrapper && a.wrapper.isConnected) return true; a.destroy(); return false; });   // stop ones that left the screen
  scope.querySelectorAll('.emo[data-cp]').forEach(span => {
    const p = loadEmoji(span.dataset.cp);
    const fallback = () => { if (span.dataset.cp) { delete span.dataset.cp; skin(span); } };
    if (!p) { fallback(); return; }
    const timer = setTimeout(fallback, 3000);
    Promise.all([p, lottieReady()]).then(([data, lottie]) => {
      clearTimeout(timer);
      if (!span.isConnected || !span.dataset.cp) return;
      const box = document.createElement('span'); box.className = 'emo-anim'; box.setAttribute('role', 'img'); box.setAttribute('aria-label', span.getAttribute('aria-label') || '');
      span.replaceWith(box);
      anims.push(lottie.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: true, animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } }));
    }, () => { clearTimeout(timer); fallback(); });
  });
}
const emo = (e, cp) => `<span class="emo"${ANIMATED_EMOJI && cp && !reduced() ? ` data-cp="${cp}"` : ''} role="img" aria-label="${esc(e)}">${e}</span>`;

/* ───────── header ───────── */
const top = $('#top'), bar = $('#bar'), plabel = $('#plabel'), count = $('#count');
function header(n, done) {
  top.hidden = cur === 'welcome';
  top.classList.toggle('endmode', cur === 'end');
  if (!n) return;
  const p = done ? n / 9 : (n - 0.5) / 9;
  bar.style.setProperty('--p', Math.min(1, p).toFixed(3));
  const lab = T.progress(n);
  if (plabel.textContent !== lab) { plabel.textContent = lab; plabel.classList.remove('swap'); void plabel.offsetWidth; plabel.classList.add('swap'); }
  count.textContent = `${n}/9`;
}

/* ───────── mounting + transitions ───────── */
const stage = $('#stage');
function mount(el, back) {
  [...stage.children].forEach(o => {
    o.style.height = o.offsetHeight + 'px'; o.style.alignSelf = 'start';   // hold position while fading out
    o.classList.remove('enter', 'enter-back'); o.classList.add('leave'); o.inert = true; o.setAttribute('aria-hidden', 'true');
    setTimeout(() => o.remove(), 200);
  });
  el.classList.add(back ? 'enter-back' : 'enter');
  el.addEventListener('animationend', ev => { if (ev.target === el) el.classList.remove('enter', 'enter-back'); });
  stage.appendChild(el);
  if (cur === 'end' || cur === 'welcome') window.scrollTo(0, 0);
}
function focusLater(node) { if (node) setTimeout(() => { if (node.isConnected) node.focus({ preventScroll: true }); }, reduced() ? 60 : 420); }
const section = (cls, id) => { const s = document.createElement('section'); s.className = 'screen ' + cls; s.dataset.screen = id; return s; };

/* ───────── screens ───────── */
function go(id, back = false) {
  clearTimeout(reactTimer);
  inReaction = null; otherOpen = false; screenBack = null;
  cur = id;
  document.body.dataset.screen = id;
  let el;
  if (id === 'welcome') el = viewWelcome();
  else if (id === 'end') el = viewEnd();
  else el = viewQuestion(id);
  mount(el, back);
  header(Q[id] ? Q[id].n : id === 'end' ? 9 : 0, id === 'end');
  syncClock();
  if (id === 'end') afterEnd(el);
}

function viewWelcome() {
  const s = section('welcome', 'welcome');
  s.innerHTML = `
    <div class="wbody">
      <div class="pin" aria-hidden="true">🗺️</div>
      <h1 class="wt" tabindex="-1">Home, office, repeat? <em>Let's map&nbsp;it.</em></h1>
      <div class="rule"></div>
      <p class="wl">Hi, I'm <b>Pratham</b> from <b>IIT&nbsp;Delhi</b>&nbsp;👋<br>I'm mapping where young grads in <span class="nb">Delhi-NCR</span><br>live and&nbsp;work.</p>
      <p class="wl sub"><mark>Under a minute.</mark> No spam, no sales pitch. Pinky&nbsp;promise&nbsp;🤙</p>
    </div>
    <div class="foot"><button class="btn" type="button" id="start"><span>Let's do this</span><span class="rocket" aria-hidden="true">🚀</span></button></div>`;
  const startBtn = $('#start', s);
  startBtn.addEventListener('click', () => {
    if (startBtn.classList.contains('launch')) return;
    if (!stepsSent.has(0)) { stepsSent.add(0); event('start'); }
    warmUp();
    startBtn.classList.add('launch');                       // rocket takes off, then the first question
    setTimeout(() => { hist.push('name'); go('name'); }, reduced() ? 0 : 420);
  });
  loadEmoji('1f44b');
  return s;
}

function viewQuestion(id) {
  const d = Q[id];
  const s = section('qs qs-' + d.kind, id);
  const head = `<div class="num" aria-hidden="true">${String(d.n).padStart(2, '0')}</div>
    <h1 class="q" id="qh" tabindex="-1">${headline(d.q)}</h1>${d.help ? `<p class="help" id="qhelp">${esc(nice(d.help))}</p>` : ''}`;
  let locked = false;

  if (d.kind === 'text' || d.kind === 'tel') {
    const val = A[id] || '';
    s.innerHTML = head + `
      ${d.live ? `<div class="live" aria-hidden="true"></div>` : ''}
      ${textForm({ type: d.kind === 'tel' ? 'tel' : 'text', ph: d.ph, ac: d.ac, max: d.max, cap: d.cap, val, label: 'qh', help: d.help ? 'qhelp' : '' })}`;
    const form = $('form', s), input = $('input', s);
    if (d.live) liveName(input, $('.live', s));
    if (d.kind === 'tel') phoneTyping(input);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (locked) return;
      const v = input.value.trim();
      if (!v) return fieldError(form, input, T.empty);
      let ph = null;
      if (d.kind === 'tel') { const r = phoneCheck(v); if (r.err) return fieldError(form, input, r.err); ph = r.ok; }
      locked = true; input.blur();
      const val = ph || (id === 'home' || id === 'office' ? placeCase(v) : v);   // saved and shown capitalised; phone saved as +91 98765 43210
      input.value = val;
      answer(id, val);
    });
    focusLater(input);
    if (id === 'name') loadEmoji('1f44b');
    return s;
  }

  // choice + tiles
  const tiles = d.kind === 'tiles';
  // work out what to show if we came back to this screen
  let view = 'main', sel = A[id], panel = null;
  if (id === 'college' && A.college) {
    if (d.opts.includes(A.college)) sel = A.college;
    else if (IITS.includes(A.college)) { view = 'iit'; sel = A.college; }
    else if (A.college === A.iitOther) { view = 'iit'; sel = ANOTHER_IIT; panel = 'iit-other'; }
    else { sel = OTHER; panel = 'college-other'; }
  }
  if (id === 'saturday' && A.saturday && !d.opts.includes(A.saturday)) { sel = SAT_OTHER; panel = 'sat-other'; }

  s.innerHTML = head + `
    ${id === 'college' ? `<p class="sublabel" id="subl" hidden>Which IIT? 🎓</p>` : ''}
    <div class="${tiles ? 'tiles' : 'opts' + (d.grid ? ' grid' : '')}" role="group" aria-labelledby="qh" id="optbox"></div>
    <div class="panel" hidden></div>`;
  const box = $('#optbox', s), panelEl = $('.panel', s), subl = $('#subl', s);

  const optBtn = (o, i) => {
    const k = 'ABCDEFGHI'[i], pressed = o === sel;
    const em = tiles ? `<span class="te" aria-hidden="true">${SAT[i] ? SAT[i].e : '✍️'}</span>`
      : d.emo && view === 'main' ? `<span class="oe" aria-hidden="true">${d.emo[i]}</span>` : '';   // small emoji, label/data stay plain
    const tone = id === 'call' ? ((CALL.find(c => c.v === o) || {}).yes ? ' yes' : ' soft') : '';
    return `<button type="button" class="opt${tiles ? ' tile' : ''}${tone}" data-v="${esc(o)}" data-k="${k}" aria-pressed="${pressed}"><span class="k" aria-hidden="true">${k}</span>${em}<span>${esc(o)}</span></button>`;
  };
  function renderList(animate) {
    const list = view === 'iit' ? IITS : d.opts;
    box.innerHTML = list.map(optBtn).join('');
    if (subl) subl.hidden = view !== 'iit';
    box.setAttribute('aria-labelledby', view === 'iit' ? 'qh subl' : 'qh');
    if (animate) { box.classList.remove('swapin'); void box.offsetWidth; box.classList.add('swapin'); }
    box.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(b)));
  }
  const satForm = () => `<form class="tform" novalidate>
      <input class="field" type="text" placeholder="What do you get up to?" maxlength="80" autocapitalize="sentences" autocomplete="off" autocorrect="on" enterkeyhint="next" aria-labelledby="qh" value="${esc(A.satOther)}">
      <input class="field f2" type="text" placeholder="You'd call yourself a…" maxlength="30" autocapitalize="words" autocomplete="off" enterkeyhint="go" aria-label="You'd call yourself a…" aria-describedby="sat2help" value="${esc(A.satType)}">
      <p class="help" id="sat2help">Optional. Like "Chai Philosopher". You'll see it at the&nbsp;end&nbsp;✨</p>
      <p class="err" role="alert"></p>
      <div class="row"><button class="go" type="submit" aria-label="Continue">${ICON_ARROW}</button><span class="hint">or press <kbd>Enter ↵</kbd></span></div>
    </form>`;
  function openPanel(kind, focus = true) {
    panel = kind; otherOpen = true; syncClock();
    panelEl.innerHTML = kind === 'sat-other' ? satForm()
      : textForm({ type: 'text', ph: kind === 'iit-other' ? 'Which one? 👇' : 'Tell me where 👇', max: 60, cap: 'words', val: kind === 'iit-other' ? A.iitOther : A.collegeOther, label: 'qh', ac: 'off' });
    panelEl.hidden = false;
    panelEl.classList.remove('open'); void panelEl.offsetWidth; panelEl.classList.add('open');
    const form = $('form', panelEl), inputs = [...form.querySelectorAll('input')];
    if (inputs[1]) inputs[0].addEventListener('keydown', e => { if (e.key === 'Enter' && inputs[0].value.trim()) { e.preventDefault(); inputs[1].focus(); } });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (locked) return;
      const v = inputs[0].value.trim();
      if (!v) return fieldError(form, inputs[0], T.empty);
      locked = true; inputs.forEach(i => i.blur());
      if (kind === 'college-other') { A.collegeOther = v; answer('college', v); }
      else if (kind === 'iit-other') { const n = /\biit\b/i.test(v) ? v : 'IIT ' + v; A.iitOther = n; answer('college', n); }
      else { A.satOther = v; A.satType = inputs[1].value.trim(); answer('saturday', v); }
    });
    if (focus) setTimeout(() => { inputs[0].focus({ preventScroll: true }); panelEl.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); }, 60);
  }
  function closePanel() { if (!panel) return; panel = null; otherOpen = false; panelEl.hidden = true; panelEl.innerHTML = ''; syncClock(); }
  function pick(b) {
    if (locked) return;
    const v = b.dataset.v;
    buzz();
    box.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    sel = v;
    if (v === OTHER) return openPanel('college-other');
    if (v === ANOTHER_IIT) return openPanel('iit-other');
    if (v === SAT_OTHER) return openPanel('sat-other');
    if (v === OTHER_IIT) {                       // swap to the IIT list; clock keeps ticking (still a tap)
      closePanel();
      setTimeout(() => { view = 'iit'; sel = null; renderList(true); }, reduced() ? 0 : 160);
      return;
    }
    closePanel();
    clock.stop();                                // the 250 ms hand-off never counts
    locked = true;
    const r = reactionFor(id, v); if (r && r.cp) loadEmoji(r.cp);
    setTimeout(() => answer(id, v), 250);
  }
  if (id === 'college') screenBack = () => {     // Back on the IIT list → all colleges
    if (view !== 'iit' || locked) return false;
    closePanel(); view = 'main'; sel = null; renderList(true);
    return true;
  };
  renderList(false);
  if (panel) openPanel(panel, false);
  if (id === 'college') loadEmoji('1f979');
  if (id === 'saturday') loadEmoji('1f929');
  focusLater($('#qh', s));
  return s;
}

function textForm({ type, ph, ac, max, cap, val, label, help }) {
  return `<form class="tform" novalidate>
      <input class="field" type="${type}" ${type === 'tel' ? 'inputmode="tel"' : ''} ${ph ? `placeholder="${esc(ph)}"` : ''}
        autocomplete="${ac || 'off'}" ${cap ? `autocapitalize="${cap}"` : ''} autocorrect="off" spellcheck="false" enterkeyhint="go"
        maxlength="${max}" value="${esc(val || '')}" aria-labelledby="${label}" ${help ? `aria-describedby="${help}"` : ''}>
      <p class="err" role="alert"></p>
      <div class="row"><button class="go" type="submit" aria-label="Continue">${ICON_ARROW}</button><span class="hint">or press <kbd>Enter ↵</kbd></span></div>
    </form>`;
}
function fieldError(form, input, msg) {
  const err = $('.err', form);
  err.textContent = msg;
  input.setAttribute('aria-invalid', 'true');
  input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
  input.focus({ preventScroll: true });
  const clear = () => { err.textContent = ''; input.removeAttribute('aria-invalid'); input.removeEventListener('input', clear); };
  input.addEventListener('input', clear);
}
function liveName(input, out) {
  let t = 0;
  const render = final => {
    const v = input.value.trim();
    out.classList.remove('done');
    if (!v) { out.textContent = ''; return; }
    if (final) { out.innerHTML = `Hi ${esc(disp(v))} <span class="w">👋</span>`; void out.offsetWidth; out.classList.add('done'); }
    else out.textContent = `Hi ${disp(v)}…`;
  };
  input.addEventListener('input', () => { clearTimeout(t); render(false); t = setTimeout(() => render(true), 650); });
  if (input.value.trim()) render(true);
}

/* ───────── answering + flow ───────── */
function answer(id, v) {
  A[id] = v;
  const n = Q[id].n;
  if (!stepsSent.has(n)) { stepsSent.add(n); event('step_' + n); }
  const r = reactionFor(id, v);
  if (r) showReaction(id, r); else next(id);
}
function nextId(id) {
  if (id === 'call') return (CALL.find(c => c.v === A.call) || {}).yes ? 'phone' : 'end';
  if (id === 'phone') return 'end';
  return ORDER[ORDER.indexOf(id) + 1];
}
function next(id) {
  const n = nextId(id);
  if (n === 'end') finish();
  hist.push(n);
  go(n);
}
function back() {
  if (inReaction) { const id = inReaction; go(id, true); return; }
  if (screenBack && screenBack()) return;
  if (hist.length > 1) { hist.pop(); go(hist[hist.length - 1], true); }
}
$('#back').addEventListener('click', back);

function reactionFor(id, v) {
  switch (id) {
    case 'name': return { e: '👋', cp: '1f44b', h: `Hi ${disp(v)}!`, s: "Pleasure's all mine 😊" };
    case 'home': return { e: '🏡', h: `${area(v)}, nice!`, s: "Hope the neighbourhood's treating you well 🤗" };
    case 'office': return isWFH(v)
      ? { kind: 'wfh', e: '💻', h: 'Commute: zero seconds.', s: 'Home office it is. May your Wi-Fi never drop mid-call 🙏' }
      : { kind: 'route', e: '🚗', h: `${area(A.home)} → ${area(v)}`, s: 'Hope the team (and the boss) take good care of you 🤝' };
    case 'college': return { kind: 'polaroid', e: '🥹', cp: '1f979', h: `${v}!`, s: v === 'IIT Delhi'
      ? 'Bet you still miss those 2 am Satpura night mess runs 🌙🍳'
      : 'Part of you is still hanging out there, isn\'t it? 💛' };
    case 'age': return AGE[v];
    case 'saturday': return (SAT.find(s => s.l === v) || SAT_CUSTOM).r;
    case 'call': return (CALL.find(c => c.v === v) || {}).r;
  }
  return null;  // gender: no reaction
}

function showReaction(id, r) {
  clearTimeout(reactTimer);
  inReaction = id;
  document.body.dataset.screen = 'r-' + id;
  const s = section('react' + (HOLD ? ' hold' : ''), 'r-' + id);
  const long = r.kind === 'route' || r.kind === 'polaroid';
  // stay long enough to see the visual and read both lines (~4 words/sec), tap skips anytime
  const words = `${r.h} ${r.s}`.trim().split(/\s+/).length;
  const dur = id === 'name' ? 1500                     // the first one is a quick hello
    : Math.round(long
      ? Math.min(5000, Math.max(2900, 1100 + words * 200))
      : Math.min(4200, Math.max(2100, 700 + words * 200)));
  s.style.setProperty('--d', dur + 'ms');
  let vis;
  if (r.kind === 'route') {
    vis = `<div class="route" aria-hidden="true">
        <svg viewBox="0 0 320 170"><path class="path" d="M30 150 C 100 150, 84 40, 160 66 S 250 30, 292 26"/>
          <circle class="pinH" cx="30" cy="150" r="9"/><circle class="pinD" cx="292" cy="26" r="10"/></svg>
        <span class="lbl lh">🏡 ${esc(area(A.home))}</span><span class="lbl lo">💼 ${esc(area(A.office))}</span>
        <div class="car"><span>🚗</span></div>
      </div>`;
  } else if (r.kind === 'polaroid') {
    vis = `<div class="polaroid" aria-hidden="true"><div class="ph">${emo(r.e, r.cp)}</div><div class="cap" style="font-size:${capSize(r.h)}px">${esc(r.h.replace(/!$/, ''))}</div></div>`;
  } else if (r.kind === 'wfh') {
    vis = `<div class="big wfh">${emo(r.e, r.cp)}<span class="badge">0 km</span></div>`;
  } else {
    vis = `<div class="big">${emo(r.e, r.cp)}</div>`;
  }
  const h = r.kind === 'route'
    ? `${esc(area(A.home))} <span class="arr">→</span> ${esc(area(A.office))}`
    : esc(nice(r.h));
  s.innerHTML = `${vis}<h1 class="rh" tabindex="-1">${h}</h1><p class="rs">${esc(nice(r.s))}</p>
    <div class="cdw"><div class="cd" aria-hidden="true"><i></i></div><button type="button" class="tapc">tap to continue</button></div>`;
  mount(s, false);
  header(Q[id].n, true);
  syncClock();
  animoji(s);
  if (r.kind === 'route') driveRoute(s);
  const cont = () => { if (inReaction === id && s.isConnected) { inReaction = null; next(id); } };
  s.addEventListener('click', cont);
  reactCont = cont;
  if (!HOLD) { reactEnd = performance.now() + dur + 350; reactTimer = setTimeout(cont, dur + 350); }
  focusLater($('.rh', s));
}

const capSize = t => { const n = t.replace(/!$/, '').length; return n <= 12 ? 30 : n <= 16 ? 26 : n <= 20 ? 22 : 19; };

function driveRoute(s) {
  const box = $('.route', s), path = $('path', box), car = $('.car', box);
  const L = path.getTotalLength();
  const place = t => {
    const k = box.clientWidth / 320;
    const p = path.getPointAtLength(L * t);
    car.style.transform = `translate3d(${(p.x * k).toFixed(1)}px,${(p.y * k).toFixed(1)}px,0) translate(-50%,-72%)`;
  };
  const END = .86;                                  // park just before the pin
  if (reduced()) { place(END); return; }
  place(0);
  const t0 = performance.now() + 250, dur = 1200;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const step = now => {
    if (!box.isConnected) return;
    const k = Math.min(1, Math.max(0, (now - t0) / dur));
    place(ease(k) * END);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* keyboard: A–F picks an option, Enter/Space/→ skips a reaction,
   ← goes back, → goes forward with the answer already given, ↑/↓ move between options */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
  const scr = $('.screen:not(.leave)', stage);
  if (inReaction) {
    if (t && t.tagName === 'BUTTON' && t.id === 'back') return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); $('.tapc', scr)?.click(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    return;
  }
  if (cur === 'end') return;
  if (cur === 'welcome') { if (e.key === 'ArrowRight') { e.preventDefault(); $('#start')?.click(); } return; }
  // in a text box the arrows move the cursor, unless the box is empty
  const empty = typing && !t.value;
  if (e.key === 'ArrowLeft' && (!typing || empty)) { e.preventDefault(); back(); return; }
  if (e.key === 'ArrowRight' && (!typing || empty)) {
    if (!A[cur]) return;                                   // nothing answered yet: stay
    e.preventDefault();
    const on = $('.opt[aria-pressed="true"]', scr);
    if (on) on.click(); else $('form.tform', scr)?.requestSubmit();
    return;
  }
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !typing) {
    const opts = [...scr.querySelectorAll('.opt')]; if (!opts.length) return;
    e.preventDefault();
    const i = opts.indexOf(document.activeElement), step = e.key === 'ArrowDown' ? 1 : -1;
    opts[i < 0 ? (step > 0 ? 0 : opts.length - 1) : (i + step + opts.length) % opts.length].focus();
    return;
  }
  if (typing || !/^[a-i]$/i.test(e.key)) return;
  const btn = $(`.screen:not(.leave) .opt[data-k="${e.key.toUpperCase()}"]`, stage);
  if (btn) { e.preventDefault(); btn.focus({ preventScroll: true }); btn.click(); }
});

/* ───────── finish + end screen ───────── */
let payload = null;
function finish() {
  clock.stop();
  finalSecs = Math.max(1, Math.round(clock.read() / 1000));
  if (!OWN_REFS.includes(MY_REF)) { OWN_REFS.push(MY_REF); store.set('own_refs', OWN_REFS.slice(-20).join(',')); }
  const sat = satOf();
  const yes = !!(CALL.find(c => c.v === A.call) || {}).yes;
  payload = {
    type: 'response',
    timestamp: new Date().toISOString(),
    name: A.name, home: A.home, office: A.office, college: A.college,
    gender: A.gender, age: A.age, saturday: A.saturday, saturday_type: sat.type,
    call: A.call, phone: yes ? A.phone : '',
    seconds_on_clock: finalSecs,
    my_ref_code: MY_REF, referred_by_code: REF_BY,
    map_contact: mapContact, device: DEVICE, session_id: SESSION
  };
  store.set('last', JSON.stringify(payload));
  post(payload);
}

function viewEnd() {
  const s = section('end', 'end');
  const yes = !!(CALL.find(c => c.v === A.call) || {}).yes;
  const name = esc(disp(A.name));
  if (!yes) {
    s.innerHTML = `
    <div class="big">${emo('💛', '1f49b')}</div>
    <h1 class="eh" tabindex="-1">Thanks, ${name}!</h1>
    <p class="es">${esc(nice("That's a wrap. Hope your weekend's a good one 🌈"))}</p>`;
    return s;
  }
  s.innerHTML = `
    <div class="big">${emo('🎉', '1f389')}</div>
    <h1 class="eh sm" tabindex="-1"><span class="sec">${reduced() ? finalSecs : 0}</span> ${secWord(finalSecs)} on the clock, ${name}!&nbsp;🎉</h1>
    <p class="es">${esc(nice("Faster than a Gurgaon signal 🚦"))}<br>${esc(nice("(we paused it while you typed)"))}</p>
    <p class="es2">${esc(nice(yes ? "I'll text you soon to find a time that suits you 🗓️" : "That's a wrap. Hope your weekend's a good one 🌈"))}</p>
    <div class="result"><span class="re" aria-hidden="true">${satOf().e}</span><div><p class="rt">${esc(satOf().type)}</p><p class="rl">${esc(nice(satOf().line))}</p></div></div>
    <div class="build"><p class="tag">${esc(nice("🛠️ What's next"))}</p><h2 class="b1">${esc("I'm building ")}<span class="ul">better weekends</span>${esc(nice(" for young grads in Delhi-NCR."))}</h2><p><span class="ln">${esc(nice("Every friend who fills this from your link helps shape it."))}</span><span class="ln">${esc(nice("Top sharers hear about it first."))}</span></p></div>
    <div class="share">
      <a class="btn accent" id="wa" href="#" target="_blank" rel="noopener">${esc(nice('Bring your friends in 🗺️'))}</a>
    </div>
    <section class="lb" id="lb" hidden></section>`;
  return s;
}

function waText() {
  return `Mapped my week in ${finalSecs} ${secWord(finalSecs)} 🗺️ Someone's building better weekends for young grads in Delhi-NCR. Takes a minute, beat my time 👀 ${shareLink()}?r=${MY_REF}`;
}

function afterEnd(s) {
  animoji(s);
  if (!$('.sec', s)) { focusLater($('.eh', s)); return; }  // "I'll pass": thanks only
  // count-up
  const secEl = $('.sec', s);
  if (!reduced()) {
    const t0 = performance.now() + 350, dur = Math.min(1600, 500 + finalSecs * 40);
    const tick = now => {
      if (!secEl.isConnected) return;
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      secEl.textContent = Math.round(finalSecs * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(confettiBurst, 300);
  }
  // share
  const wa = $('#wa', s);
  wa.href = 'https://wa.me/?text=' + encodeURIComponent(waText());
  // map-first
  const mf = $('#mapForm', s);
  if (mf) {
    const inp = $('#mapIn', mf);
    mf.addEventListener('submit', e => {
      e.preventDefault();
      const v = inp.value.trim();
      if (!v) return fieldError(mf, inp, T.empty);
      if (digits(v) < 10) return fieldError(mf, inp, T.short);
      mapContact = v;
      if (payload) { payload.map_contact = v; store.set('last', JSON.stringify(payload)); }
      post({ type: 'map_contact', my_ref_code: MY_REF, map_contact: v, session_id: SESSION, timestamp: new Date().toISOString() });
      const ok = document.createElement('p'); ok.className = 'ok'; ok.textContent = "I'll send it to your number 📱";
      mf.replaceWith(ok);
    });
  }
  loadBoard($('#lb', s));
  focusLater($('.eh', s));
}

function confettiBurst() {
  if (typeof window.confetti !== 'function' || reduced()) return;
  const colors = ['#E14B2B', '#F2A541', '#1D1A16', '#F9DFD6', '#6FA58E', '#FBF8F2'];
  const c = window.confetti;
  c({ particleCount: 110, spread: 78, startVelocity: 42, origin: { y: .32 }, colors, scalar: .95, ticks: 220, disableForReducedMotion: true });
  setTimeout(() => {
    c({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: .55 }, colors, disableForReducedMotion: true });
    c({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: .55 }, colors, disableForReducedMotion: true });
  }, 220);
}

/* ───────── leaderboard (off until LEADERBOARD = true) ───────── */
async function loadBoard(box) {
  if (!box || !CFG.leaderboard || !CFG.script) return;
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 5000);
    const res = await fetch(CFG.script + (CFG.script.includes('?') ? '&' : '?') + 'action=colleges', { signal: ctl.signal });
    clearTimeout(to);
    const data = await res.json();
    const norm = x => String(x).trim().toLowerCase();
    const list = (data.colleges || []).filter(x => x && x.college).map(x => ({ college: String(x.college), count: +x.count || 0 }));
    let me = list.find(x => norm(x.college) === norm(A.college));
    if (!me) { me = { college: A.college, count: 1 }; list.push(me); }
    list.sort((a, b) => b.count - a.count);
    const rank = list.indexOf(me) + 1;
    const medal = ['🥇', '🥈', '🥉'][rank - 1] || '';
    const max = list[0].count || 1;
    box.innerHTML = `<h2>Your college: #${rank} ${medal}</h2>
      <ol>${list.slice(0, 5).map(x => `<li class="${x === me ? 'me' : ''}"><span>${esc(x.college)}</span><span class="n">${x.count}</span><span class="b"><i style="--w:${(x.count / max).toFixed(3)}"></i></span></li>`).join('')}</ol>
      <a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent(waText())}" target="_blank" rel="noopener">Send it to your batch 👀</a>`;
    box.hidden = false;
  } catch (e) { box.hidden = true; }
}

/* debug/test hook (read-only) */
window.__mapweek = Object.freeze({
  clockMs: () => clock.read(), clockOn: () => clock.on, screen: () => (inReaction ? 'r-' + inReaction : cur),
  answers: () => ({ ...A }), seconds: () => finalSecs, myRef: () => MY_REF, refBy: () => REF_BY
});

/* boot */
go('welcome');
// once they tap Start: load the animation player and warm up the reaction emojis
// (not before, so someone who only looks at the welcome page downloads far less)
let warmed = false;
function warmUp() {
  if (warmed) return; warmed = true;
  if (ANIMATED_EMOJI && !reduced()) { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js'; sc.async = true; document.head.append(sc); }
  setTimeout(() => {
    [...new Set(['1f44b', '1f979', '1f49b', '1f389', ...Object.values(AGE).map(a => a.cp), ...SAT.map(s => s.r.cp), SAT_CUSTOM.r.cp, ...CALL.map(c => c.r.cp)])]
      .forEach(cp => loadEmoji(cp));
  }, 1200);
}
})();
