"use strict";
/**
 * daemon/webui.ts — the AutoClaw Control read-only web UI (CP-3.4).
 *
 * A DEDICATED loopback HTTP listener (distinct from the bridge port) serving one
 * self-contained page + a few read-only JSON endpoints. This is the ONLY listener
 * ever proxied beyond loopback (Tailscale Serve, CP-3.5) — the bridge port, with
 * its loopback-trust unauthenticated KG routes + CORS `*`, is NEVER exposed
 * (spec §3.6). P1 is read-only: no mutation route exists here.
 *
 * The page is self-contained (inline CSS/JS, no external fetches beyond its own
 * `/api/*`) so it works over a strict CSP and as a future PWA. It puts the
 * **review queue front and center** (the program's thesis) above the roster +
 * kanban. Mutating actions (approve a review from the phone) arrive in M4 via the
 * acked `review_decision` control verb, not here.
 *
 * `renderWebUiPage` is pure/testable; `createWebUiServer` wires the routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROXY_INDICATOR_HEADERS = exports.DAEMON_WEBUI_PORT_DEFAULT = void 0;
exports.requestPrincipal = requestPrincipal;
exports.readControlStates = readControlStates;
exports.writeReviewDecisionCommand = writeReviewDecisionCommand;
exports.readReviewView = readReviewView;
exports.renderWebUiPage = renderWebUiPage;
exports.renderWebManifest = renderWebManifest;
exports.renderIconSvg = renderIconSvg;
exports.renderServiceWorker = renderServiceWorker;
exports.renderPairPage = renderPairPage;
exports.renderLocalBootstrapPage = renderLocalBootstrapPage;
exports.createWebUiServer = createWebUiServer;
exports.startWebUi = startWebUi;
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const controlState_1 = require("../fleet/controlState");
const controlHandler_1 = require("../fleet/controlHandler");
const viewerAuth_1 = require("./viewerAuth");
const qr_1 = require("./qr");
const push_1 = require("./push");
exports.DAEMON_WEBUI_PORT_DEFAULT = 9980;
/**
 * Any header whose presence means the request was RELAYED through a proxy (i.e.
 * did NOT originate as a direct loopback connection). Tailscale Serve sets
 * `x-forwarded-*`; other proxies set `forwarded`/`via`/`x-real-ip`. We treat the
 * presence of ANY of them as "not local" so remote traffic can never be mistaken
 * for the local operator — this is the security invariant CP-3.5 depends on.
 *
 * DEPLOYMENT ASSUMPTION (pinned by webui.test + docs/…/autoclawd-operations.md):
 * the web UI is loopback-bound and only ever fronted by Tailscale Serve, which
 * sets forwarding headers. Do NOT front it with a proxy that STRIPS these headers
 * — that would let relayed traffic look local. If you must, run in strict mode
 * (`requireAuth`), which drops the loopback-operator trust entirely.
 */
exports.PROXY_INDICATOR_HEADERS = [
    'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'forwarded',
    'x-real-ip', 'via', 'tailscale-user-login', 'tailscale-user-name',
];
function requestPrincipal(req, workspaceRoot, now = new Date(), opts = {}) {
    const ra = req.socket?.remoteAddress || '';
    const loopbackPeer = ra === '127.0.0.1' || ra === '::1' || ra === '::ffff:127.0.0.1';
    const proxied = exports.PROXY_INDICATOR_HEADERS.some((h) => req.headers[h] !== undefined);
    const secure = req.headers['x-forwarded-proto'] === 'https';
    const isLocal = loopbackPeer && !proxied;
    // Fail-CLOSED where it matters: a session cookie is always resolved to its
    // scope; the loopback-operator shortcut applies ONLY to a direct local peer and
    // ONLY when strict mode is off. In strict mode even the local peer must pair
    // (it keeps `local:true` so it can still bootstrap a pairing code).
    const token = (0, viewerAuth_1.sessionTokenFromCookie)(req.headers['cookie']);
    const session = (0, viewerAuth_1.validateSession)(workspaceRoot, token, now);
    if (isLocal && !opts.requireAuth) {
        return { scope: 'operator', local: true, proxied: false, secure };
    }
    return { scope: session ? session.scope : null, local: isLocal, proxied, secure };
}
function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    }
    catch {
        return null;
    }
}
function listJson(dir) {
    try {
        return fs.readdirSync(dir).filter((n) => n.endsWith('.json'));
    }
    catch {
        return [];
    }
}
/**
 * Read the control-command lifecycle (CP-4.3): the canonical `comms/control/`
 * command files ⋈ their `comms/control/acks/` records, projected to
 * pending/applied/rejected/expired via codex's pure `buildControlCommandStates`.
 * Read-only — the daemon never mutates control state here (that is the ack
 * handler's job under the lease).
 */
function readControlStates(workspaceRoot, now) {
    const controlDir = path.join(workspaceRoot, '.autoclaw', 'orchestrator', 'comms', 'control');
    const acksDir = path.join(controlDir, 'acks');
    const commands = [];
    for (const name of listJson(controlDir)) {
        const cmd = readJson(path.join(controlDir, name));
        if (cmd && typeof cmd.id === 'string') {
            commands.push(cmd);
        }
    }
    const acks = [];
    for (const name of listJson(acksDir)) {
        const ack = readJson(path.join(acksDir, name));
        if (ack && typeof ack.ack_of === 'string') {
            acks.push(ack);
        }
    }
    return (0, controlState_1.buildControlCommandStates)(commands, acks, now !== undefined ? { now } : {});
}
/**
 * Write a `review_decision` control command (CP-4.5) from the local Control
 * surface. LOCAL by definition (a loopback POST is the human at the machine —
 * spec §3.5), stamped with the reserved human grant; the loop's ack handler
 * validates + executes it, so the vote lands and the next tally resolves the
 * review. The daemon never writes the vote directly — it only issues the command,
 * which flows through the SAME acked path a paired phone will use.
 */
function writeReviewDecisionCommand(workspaceRoot, input, now = new Date()) {
    const controlDir = path.join(workspaceRoot, '.autoclaw', 'orchestrator', 'comms', 'control');
    const id = `ctl-${crypto.randomUUID()}`;
    const command = {
        id, from: 'human', type: 'review_decision', session_id: 'webui',
        timestamp: now.toISOString(),
        target: { task_id: input.task_id },
        reason: input.comment,
        requires_ack: true,
        capability_grant_id: controlHandler_1.RESERVED_HUMAN_GRANT_ID,
        expires_at: new Date(now.getTime() + 5 * 60000).toISOString(),
        payload: { vote: input.vote, comment: input.comment ?? '' },
    };
    fs.mkdirSync(controlDir, { recursive: true });
    const file = path.join(controlDir, `${id}.json`);
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(command, null, 2), 'utf8');
    fs.renameSync(tmp, file);
    return id;
}
/** Read the review-queue view: the WIP gate state + the open reviews. */
function readReviewView(workspaceRoot) {
    const orch = path.join(workspaceRoot, '.autoclaw', 'orchestrator');
    const digest = readJson(path.join(orch, 'comms', 'fleet-status.json'));
    const board = readJson(path.join(orch, 'board.json'));
    return {
        gate: digest?.review_queue ?? { depth: 0, gated: false },
        reviews: Array.isArray(board?.awaiting_review) ? board.awaiting_review : [],
    };
}
/**
 * The single self-contained page. Pure — takes no data; the inline JS polls the
 * `/api/*` endpoints and renders client-side, so the same HTML serves every tick.
 */
function renderWebUiPage() {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<meta name="theme-color" content="#c20000"/>
<link rel="apple-touch-icon" href="/icon.svg"/>
<title>AutoClaw Control</title>
<style>
  :root { color-scheme: light dark; --bg:#0f1115; --card:#171a21; --line:#272b33; --fg:#e6e8ec; --dim:#9aa3b0; --accent:#c20000; --ok:#2ea043; --warn:#d29922; }
  * { box-sizing:border-box; } body { margin:0; font:14px/1.5 system-ui,sans-serif; background:var(--bg); color:var(--fg); }
  header { padding:12px 16px; border-bottom:1px solid var(--line); display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0; } .muted { color:var(--dim); } main { padding:16px; max-width:1100px; margin:0 auto; }
  section { margin-bottom:24px; } h2 { font-size:14px; text-transform:uppercase; letter-spacing:.05em; color:var(--dim); border-bottom:1px solid var(--line); padding-bottom:6px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin:8px 0; }
  .gate { border-left:4px solid var(--ok); } .gate.closed { border-left-color:var(--warn); }
  .row { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; } .grow { flex:1; } .pill { font-size:11px; padding:2px 7px; border-radius:10px; background:#222834; color:var(--dim); }
  .lanes { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; } .lane { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 10px; }
  .lane b { display:block; font-size:22px; } .agent { display:flex; gap:8px; align-items:baseline; padding:3px 0; } .dot { width:8px; height:8px; border-radius:50%; background:var(--dim); } .dot.active { background:var(--ok); }
  code { color:var(--accent); } .foot { color:var(--dim); font-size:12px; padding:8px 16px; border-top:1px solid var(--line); }
  .btn { font:12px system-ui,sans-serif; background:#222834; color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:4px 10px; cursor:pointer; } .btn.ok { border-color:var(--ok); } .btn:hover { background:#2b3242; }
</style></head>
<body>
<header><h1>AutoClaw <span class="muted">Control</span></h1><span id="cycle" class="pill">…</span><span class="grow"></span>
  <button id="notify-btn" class="btn" style="display:none" onclick="enablePush()">🔔 Notify me</button>
  <button id="pair-btn" class="btn" style="display:none" onclick="pairNew()">📱 Pair device</button>
  <span id="ts" class="muted"></span></header>
<main>
  <section id="pair-section" class="card" style="display:none">
    <div class="row"><b>Pair a device</b><span class="grow"></span><button class="btn" onclick="$('pair-section').style.display='none'">✕</button></div>
    <p class="muted" style="margin:6px 0">Scan this on your phone (same Tailscale network), or open <code id="pair-host">this host</code><code>/pair</code> and enter the code. Valid 3 minutes, single use.</p>
    <div class="row" style="align-items:flex-start;gap:16px">
      <div id="pair-qr" style="background:#fff;border-radius:8px;padding:6px;line-height:0;min-width:150px"></div>
      <div>
        <div class="muted" style="font-size:12px">pairing code</div>
        <div id="pair-code" style="font-size:26px;letter-spacing:.08em;font-weight:700;margin:2px 0">…</div>
        <span id="pair-scope" class="pill"></span>
        <div style="margin-top:8px"><label class="muted" style="font-size:12px">Tailscale URL for this host</label>
          <input id="pair-base" placeholder="https://host.tailnet.ts.net" style="width:100%;margin-top:2px;padding:6px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg)"/></div>
        <div class="row" style="margin-top:6px"><a id="pair-link" class="btn ok" href="#" target="_blank" rel="noopener">Open link on this device →</a></div>
      </div>
    </div>
    <div id="pair-sessions" style="margin-top:10px"></div>
  </section>
  <section id="review-section">
    <h2>Review Queue</h2>
    <div id="gate" class="card gate">loading…</div>
    <div id="reviews"></div>
  </section>
  <section id="control-section" style="display:none"><h2>Control Commands</h2><div id="control"></div></section>
  <section><h2>Board</h2><div id="lanes" class="lanes"></div></section>
  <section><h2>Roster</h2><div id="roster" class="card"></div></section>
</main>
<div class="foot">AutoClaw Control · loopback = operator · paired devices reach this over Tailscale.</div>
<script>
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function j(u){ try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } }
function fmtAge(ms){ ms=+ms||0; const m=Math.round(ms/60000); if(m<60) return m+'m'; const h=Math.floor(m/60); return h+'h'; }
async function tick(){
  const [digest, board, reviews, control] = await Promise.all([j('/api/digest'), j('/api/board'), j('/api/reviews'), j('/api/control')]);
  if (digest) { $('cycle').textContent = digest.cycle||'—'; $('ts').textContent = 'updated '+(digest.generated_at||'').replace('T',' ').replace(/\\..*/,''); }
  // Review queue front-and-center.
  const g = (reviews && reviews.gate) || (digest && digest.review_queue) || {depth:0,gated:false};
  const gate = $('gate'); gate.className = 'card gate' + (g.gated ? ' closed' : '');
  gate.innerHTML = g.gated
    ? '<b>WIP GATE CLOSED</b> — '+esc(g.reason||('queue at capacity ('+g.depth+'/'+(g.wip_cap||'?')+')'))
    : '<b>Open</b> · '+ (g.depth||0) +' in review'+(g.delivered_unreviewed?(' · '+g.delivered_unreviewed+' delivered, unreviewed'):'')+(g.wip_cap?(' / cap '+g.wip_cap):'');
  const list = (reviews && reviews.reviews) || [];
  $('reviews').innerHTML = list.length ? list.map(r => {
    const t = esc(r.task_id);
    const unreviewed = (r.votes_received||0) === 0; // CP-2.4: delivered but nobody has voted yet
    const statusPill = unreviewed
      ? '<span class="pill" style="background:#3a2f12;color:#e3b341">🆕 delivered · awaiting first review</span>'
      : '<span class="muted">'+ (r.approvals!=null?(r.approvals+'/'+(r.votes_required||'?')+' ✔'):'') +'</span>';
    return '<div class="card"><div class="row"><b>'+t+'</b><span class="pill">'+esc(r.author||'?')+'</span>'
    +'<span class="grow"></span>'+statusPill
    +'<span class="pill">'+fmtAge(r.age_ms)+'</span></div>'
    +'<div class="row" style="margin-top:6px"><button class="btn ok" onclick="decide(\\''+t+'\\',\\'approve\\')">✔ Approve</button>'
    +'<button class="btn" onclick="decide(\\''+t+'\\',\\'request_changes\\')">Request changes</button></div></div>';
  }).join('') : '<div class="muted">No open reviews.</div>';
  // Control command lifecycle (pending → applied/rejected/expired).
  const cmds = (control && control.commands) || [];
  if (cmds.length) {
    $('control-section').style.display = '';
    const cls = { applied:'ok', rejected:'warn', expired:'warn', pending:'', noop:'' };
    $('control').innerHTML = cmds.slice().reverse().map(c =>
      '<div class="card gate'+(cls[c.status]==='warn'?' closed':'')+'"><div class="row"><b>'+esc(c.command_type)+'</b>'
      +'<span class="pill">'+esc(c.status)+'</span><span class="muted">'+esc(c.from)+'</span>'
      +'<span class="grow"></span><span class="pill">'+fmtAge(c.age_ms)+'</span></div>'
      +(c.detail?'<div class="muted">'+esc(c.detail)+'</div>':'')+'</div>').join('');
  } else { $('control-section').style.display = 'none'; }
  // Board lanes.
  if (board) $('lanes').innerHTML = [['claimable','Claimable'],['in_flight','In flight'],['awaiting_review','In review'],['stuck','Stuck']]
    .map(([k,label]) => '<div class="lane"><b>'+((board[k]||[]).length)+'</b>'+label+'</div>').join('');
  // Roster.
  if (digest && digest.agents) $('roster').innerHTML = digest.agents.map(a =>
    '<div class="agent"><span class="dot '+(/(active|working|idle)/.test(a.status||'')?'active':'')+'"></span><b>'+esc(a.id)+'</b>'
    +'<span class="muted">'+esc(a.role||'')+'</span><span class="grow"></span><span class="pill">'+(a.inflight||0)+' inflight</span></div>').join('') || '<span class="muted">No agents.</span>';
}
async function decide(task, vote){
  try { await fetch('/api/control/review-decision', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ task_id: task, vote }) }); } catch {}
  setTimeout(tick, 600);
}
async function post(u, b){ try { const r = await fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body: b?JSON.stringify(b):'{}' }); return r.ok ? await r.json() : null; } catch { return null; } }
// Pairing (loopback/local only — the button is hidden otherwise).
let pairCode = '';
async function whoami(){
  const w = await j('/api/whoami');
  if (w && w.local) {
    $('pair-btn').style.display=''; $('pair-host').textContent = location.origin;
    const saved = (function(){ try { return localStorage.getItem('ac_base'); } catch { return null; } })();
    $('pair-base').value = w.public_base_url || saved || '';
    $('pair-base').addEventListener('input', renderQr);
  }
}
function baseUrl(){ return ($('pair-base').value || location.origin).replace(/\\/$/, ''); }
function renderQr(){
  if (!pairCode) { return; }
  const base = baseUrl(); try { localStorage.setItem('ac_base', $('pair-base').value || ''); } catch {}
  const full = base + '/pair?code=' + encodeURIComponent(pairCode);
  $('pair-qr').innerHTML = '<img alt="pairing QR" width="150" height="150" src="/api/pair/qr?text=' + encodeURIComponent(full) + '"/>';
  const link = $('pair-link'); link.href = full;
}
async function pairNew(){
  const r = await post('/api/pair/new', { scope:'operator' });
  if (!r || !r.ok) { return; }
  pairCode = r.code;
  $('pair-section').style.display=''; $('pair-code').textContent = r.code; $('pair-scope').textContent = r.scope + ' · single use';
  renderQr();
  loadSessions();
}
async function loadSessions(){
  const r = await j('/api/pair/list'); const box = $('pair-sessions'); if (!r || !r.sessions) { box.innerHTML=''; return; }
  const live = r.sessions.filter(s => !s.revoked);
  box.innerHTML = live.length ? '<div class="muted" style="margin-bottom:4px">Paired devices</div>' + live.map(s =>
    '<div class="row" style="padding:2px 0"><span class="dot active"></span><b>'+esc(s.label)+'</b><span class="pill">'+esc(s.scope)+'</span>'
    +'<span class="grow"></span><button class="btn" onclick="revokeSess(\\''+esc(s.id)+'\\')">Revoke</button></div>').join('') : '';
}
async function revokeSess(id){ await post('/api/pair/revoke', { id }); loadSessions(); }
// Web push enrollment (CP-4.4): the button shows only where push CAN work
// (secure context + Notification API) and this device is not yet enrolled.
function b64ToBytes(s){ const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++){a[i]=b.charCodeAt(i);} return a; }
async function pushState(){
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { return null; }
  try { const reg = await navigator.serviceWorker.ready; return { reg, sub: await reg.pushManager.getSubscription() }; } catch { return null; }
}
async function refreshPushBtn(){
  const st = await pushState();
  $('notify-btn').style.display = (st && !st.sub && Notification.permission !== 'denied') ? '' : 'none';
}
async function enablePush(){
  const st = await pushState(); if (!st) { return; }
  try {
    if ((await Notification.requestPermission()) !== 'granted') { return; }
    const cfg = await j('/api/push/config'); if (!cfg || !cfg.public_key) { return; }
    const sub = await st.reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(cfg.public_key) });
    await post('/api/push/subscribe', { subscription: sub.toJSON() });
  } catch {}
  refreshPushBtn();
}
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').then(refreshPushBtn).catch(()=>{}); }
whoami(); tick(); setInterval(tick, 5000);
</script>
</body></html>`;
}
/** The PWA manifest — makes Control installable to a phone home screen (CP-3.5). */
function renderWebManifest() {
    return JSON.stringify({
        name: 'AutoClaw Control',
        short_name: 'AutoClaw',
        description: 'Fleet review queue — glance and approve from anywhere on your tailnet.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#c20000',
        icons: [
            { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
    });
}
/** A tiny self-contained "spine" mark (no external asset) for the PWA icon. */
function renderIconSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
<rect width="192" height="192" rx="36" fill="#0f1115"/>
<g fill="none" stroke="#c20000" stroke-width="14" stroke-linecap="round">
<path d="M96 28 V164"/>
<path d="M96 52 L60 40"/><path d="M96 52 L132 40"/>
<path d="M96 84 L56 72"/><path d="M96 84 L136 72"/>
<path d="M96 116 L58 104"/><path d="M96 116 L134 104"/>
<path d="M96 148 L64 138"/><path d="M96 148 L128 138"/>
</g></svg>`;
}
/** Minimal service worker: shell cached for an offline glance, /api always live.
 *  CP-4.4 adds the push + notificationclick handlers — payloads are the JSON
 *  {title, body, tag, url} messages autoclawd encrypts in daemon/push.ts. */
function renderServiceWorker() {
    return `const C='autoclaw-control-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['/','/manifest.webmanifest','/icon.svg']).catch(()=>{}))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) { return; } // live data never cached
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)).catch(()=>{}); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(m.title || 'AutoClaw Control', {
    body: m.body || '', tag: m.tag || 'autoclaw', icon: '/icon.svg', badge: '/icon.svg', data: { url: m.url || '/' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});`;
}
/** The public /pair landing — where a phone enters its pairing code (QR fallback). */
function renderPairPage(message = '') {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>Pair · AutoClaw Control</title>
<style>body{margin:0;font:16px/1.5 system-ui,sans-serif;background:#0f1115;color:#e6e8ec;display:flex;min-height:100vh;align-items:center;justify-content:center}
form{background:#171a21;border:1px solid #272b33;border-radius:12px;padding:24px;max-width:340px;width:90%}
h1{font-size:18px;margin:0 0 4px}.m{color:#9aa3b0;font-size:14px;margin:0 0 16px}
input{width:100%;font:20px monospace;letter-spacing:.1em;text-transform:uppercase;padding:12px;border-radius:8px;border:1px solid #272b33;background:#0f1115;color:#e6e8ec;box-sizing:border-box}
button{width:100%;margin-top:12px;padding:12px;border-radius:8px;border:1px solid #2ea043;background:#12331d;color:#e6e8ec;font-size:16px;cursor:pointer}
.err{color:#d29922;font-size:14px;margin-top:10px}</style></head>
<body><form method="GET" action="/pair"><h1>Pair this device</h1><p class="m">Enter the code shown in AutoClaw Control on your computer.</p>
<input name="code" placeholder="XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" autofocus/>
<button type="submit">Pair</button>${message ? `<div class="err">${message}</div>` : ''}</form></body></html>`;
}
/** Strict-mode (requireAuth) bootstrap for a LOCAL browser: one click self-pairs
 *  this device. Shown only to a loopback peer that has no session yet. */
function renderLocalBootstrapPage() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>AutoClaw Control</title>
<style>body{margin:0;font:16px/1.5 system-ui,sans-serif;background:#0f1115;color:#e6e8ec;display:flex;min-height:100vh;align-items:center;justify-content:center}
div{background:#171a21;border:1px solid #272b33;border-radius:12px;padding:24px;max-width:360px;width:90%;text-align:center}
h1{font-size:18px;margin:0 0 4px}p{color:#9aa3b0;font-size:14px}
button{margin-top:8px;padding:12px 20px;border-radius:8px;border:1px solid #2ea043;background:#12331d;color:#e6e8ec;font-size:16px;cursor:pointer}</style></head>
<body><div><h1>Pair this browser</h1><p>Strict auth is on. This is the local machine, so you can pair this browser directly.</p>
<button onclick="pair()">Pair this browser</button><p id="e" style="color:#d29922"></p></div>
<script>async function pair(){try{const r=await fetch('/api/pair/self',{method:'POST'});if(r.ok){location.href='/';}else{document.getElementById('e').textContent='Bootstrap failed.';}}catch{document.getElementById('e').textContent='Bootstrap failed.';}}</script>
</body></html>`;
}
/** Create the web-UI HTTP server. Does not listen. */
function createWebUiServer(opts) {
    const page = renderWebUiPage();
    const manifest = renderWebManifest();
    const iconSvg = renderIconSvg();
    const serviceWorker = renderServiceWorker();
    const setSessionCookie = (token, expiresAt, secure) => `ac_session=${token}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)}`;
    return http.createServer((req, res) => {
        const full = new URL(req.url || '/', 'http://localhost');
        const url = full.pathname;
        const sendJson = (obj, code = 200) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj));
        };
        const who = requestPrincipal(req, opts.workspaceRoot, new Date(), { requireAuth: opts.requireAuth });
        // ---- PUBLIC routes (no principal): PWA shell assets + the pairing carve-out.
        // "unpaired node 401s EVERYWHERE BUT PAIRING" — these are the exceptions.
        if (req.method === 'GET' && url === '/manifest.webmanifest') {
            res.writeHead(200, { 'Content-Type': 'application/manifest+json' }).end(manifest);
            return;
        }
        if (req.method === 'GET' && url === '/icon.svg') {
            res.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end(iconSvg);
            return;
        }
        if (req.method === 'GET' && url === '/sw.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/' }).end(serviceWorker);
            return;
        }
        if (req.method === 'GET' && url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
            return;
        }
        // Pairing redemption / landing (public — this is how an unpaired device gets in).
        if (req.method === 'GET' && url === '/pair') {
            const code = full.searchParams.get('code');
            if (!code) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(renderPairPage());
                return;
            }
            const result = (0, viewerAuth_1.redeemPairingCode)(opts.workspaceRoot, code);
            if (!result.ok) {
                const msg = result.error === 'expired' ? 'That code has expired — generate a new one.' : 'Code not recognized — check it and try again.';
                res.writeHead(result.error === 'expired' ? 410 : 404, { 'Content-Type': 'text/html; charset=utf-8' }).end(renderPairPage(msg));
                return;
            }
            res.writeHead(303, {
                'Set-Cookie': setSessionCookie(result.token, result.expires_at, who.secure),
                'Location': '/',
            }).end();
            return;
        }
        // ---- LOCAL-ONLY routes: mint / list / revoke pairings. The human at the machine.
        if (url === '/api/whoami') {
            sendJson({ scope: who.scope, local: who.local, public_base_url: opts.publicBaseUrl ?? null });
            return;
        }
        if (url.startsWith('/api/pair/')) {
            if (!who.local) {
                sendJson({ ok: false, error: 'pairing management is local-only' }, 403);
                return;
            }
            // Render a pairing URL as a scannable QR (SVG). Local-only + length-capped;
            // the client passes the full tailnet URL so the phone scans a reachable link.
            if (req.method === 'GET' && url === '/api/pair/qr') {
                const text = full.searchParams.get('text') || '';
                if (!text || text.length > 512) {
                    sendJson({ ok: false, error: 'text required (≤512 chars)' }, 400);
                    return;
                }
                try {
                    const svg = (0, qr_1.qrToSvg)(text, { scale: 5, quiet: 4 });
                    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }).end(svg);
                }
                catch {
                    sendJson({ ok: false, error: 'could not encode (too long for a QR symbol)' }, 422);
                }
                return;
            }
            if (req.method === 'POST' && url === '/api/pair/new') {
                let body = '';
                req.on('data', (c) => { body += c; if (body.length > 8000) {
                    req.destroy();
                } });
                req.on('end', () => {
                    let scope = 'operator';
                    try {
                        const b = JSON.parse(body || '{}');
                        if (b.scope === 'viewer') {
                            scope = 'viewer';
                        }
                        const minted = (0, viewerAuth_1.mintPairingCode)(opts.workspaceRoot, { scope, label: b.label });
                        sendJson({ ok: true, ...minted });
                    }
                    catch {
                        const minted = (0, viewerAuth_1.mintPairingCode)(opts.workspaceRoot, { scope });
                        sendJson({ ok: true, ...minted });
                    }
                });
                return;
            }
            if (req.method === 'GET' && url === '/api/pair/list') {
                sendJson({ sessions: (0, viewerAuth_1.listSessions)(opts.workspaceRoot) });
                return;
            }
            if (req.method === 'POST' && url === '/api/pair/revoke') {
                let body = '';
                req.on('data', (c) => { body += c; if (body.length > 8000) {
                    req.destroy();
                } });
                req.on('end', () => { try {
                    const b = JSON.parse(body || '{}');
                    sendJson({ ok: b.id ? (0, viewerAuth_1.revokeSession)(opts.workspaceRoot, b.id) : false });
                }
                catch {
                    sendJson({ ok: false }, 400);
                } });
                return;
            }
            // Strict-mode bootstrap: mint an operator code + redeem it in one step, setting
            // the cookie for THIS local browser. Local-only, so only the human at the
            // machine self-pairs — this is what makes requireAuth mode usable locally.
            if (req.method === 'POST' && url === '/api/pair/self') {
                const minted = (0, viewerAuth_1.mintPairingCode)(opts.workspaceRoot, { scope: 'operator', label: 'this browser (local)' });
                const redeemed = (0, viewerAuth_1.redeemPairingCode)(opts.workspaceRoot, minted.code);
                if (!redeemed.ok) {
                    sendJson({ ok: false, error: 'bootstrap failed' }, 500);
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': setSessionCookie(redeemed.token, redeemed.expires_at, who.secure) });
                res.end(JSON.stringify({ ok: true, scope: redeemed.scope }));
                return;
            }
            sendJson({ ok: false, error: 'not found' }, 404);
            return;
        }
        // ---- GATE: from here on a principal is required. Unpaired remote → 401.
        if (who.scope === null) {
            if (url === '/' || url === '/index.html') {
                // A local peer in strict mode can self-pair in one click; a remote unpaired
                // device gets the code-entry page.
                const body = who.local ? renderLocalBootstrapPage() : renderPairPage('This device is not paired. Ask the host to show a pairing code.');
                res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' }).end(body);
                return;
            }
            sendJson({ ok: false, error: 'unpaired — visit /pair' }, 401);
            return;
        }
        // The ONE mutation: a review_decision (CP-4.5). Requires OPERATOR scope — a
        // read-only `viewer` session is refused here (exit test: viewer cannot write).
        // It only ISSUES an acked control command; the loop's handler validates +
        // executes it, so a paired operator rides the SAME path as the local human.
        if (req.method === 'POST' && url === '/api/control/review-decision') {
            if (who.scope !== 'operator') {
                sendJson({ ok: false, error: 'viewer scope cannot approve reviews' }, 403);
                return;
            }
            let body = '';
            req.on('data', (c) => { body += c; if (body.length > 64000) {
                req.destroy();
            } });
            req.on('end', () => {
                try {
                    const b = JSON.parse(body);
                    const vote = b.vote === 'approve' || b.vote === 'request_changes' || b.vote === 'reject' ? b.vote : null;
                    if (!b.task_id || !vote) {
                        res.writeHead(400, { 'Content-Type': 'application/json' }).end('{"ok":false,"error":"task_id + vote(approve|request_changes|reject) required"}');
                        return;
                    }
                    const id = writeReviewDecisionCommand(opts.workspaceRoot, { task_id: b.task_id, vote, comment: b.comment });
                    res.writeHead(202, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true, command_id: id, note: 'queued — the loop ack handler applies it' }));
                }
                catch {
                    res.writeHead(400, { 'Content-Type': 'application/json' }).end('{"ok":false,"error":"invalid JSON"}');
                }
            });
            return;
        }
        // ---- Web push enrollment (CP-4.4). Any PAIRED principal (or the local
        // operator) may enroll its own device — notifications are read-only info, so
        // viewer scope qualifies. The test-fire is operator-only (it makes phones buzz).
        if (url === '/api/push/config') {
            sendJson({ enabled: true, public_key: (0, push_1.vapidPublicKey)(opts.workspaceRoot), devices: (0, push_1.summarizeSubscriptions)(opts.workspaceRoot).length });
            return;
        }
        if (req.method === 'POST' && (url === '/api/push/subscribe' || url === '/api/push/unsubscribe')) {
            let body = '';
            req.on('data', (c) => { body += c; if (body.length > 16000) {
                req.destroy();
            } });
            req.on('end', () => {
                try {
                    const b = JSON.parse(body || '{}');
                    if (url === '/api/push/subscribe') {
                        const r = (0, push_1.addSubscription)(opts.workspaceRoot, b.subscription ?? {}, b.label || (who.local ? 'this browser (local)' : `paired device (${who.scope})`));
                        sendJson(r, r.ok ? 200 : 400);
                    }
                    else {
                        const endpoint = b.endpoint ?? b.subscription?.endpoint;
                        sendJson({ ok: endpoint ? (0, push_1.removeSubscription)(opts.workspaceRoot, { endpoint }) : false });
                    }
                }
                catch {
                    sendJson({ ok: false, error: 'invalid JSON' }, 400);
                }
            });
            return;
        }
        if (req.method === 'POST' && url === '/api/push/test') {
            if (who.scope !== 'operator') {
                sendJson({ ok: false, error: 'operator scope required' }, 403);
                return;
            }
            void (0, push_1.broadcastPush)(opts.workspaceRoot, { title: 'AutoClaw Control', body: 'Test notification — push is working.', tag: 'test', url: '/' })
                .then((r) => sendJson({ ok: true, ...r }));
            return;
        }
        if (req.method !== 'GET') {
            res.writeHead(405).end('method not allowed');
            return;
        }
        if (url === '/' || url === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(page);
            return;
        }
        if (url === '/api/digest') {
            sendJson(readJson(path.join(opts.workspaceRoot, '.autoclaw', 'orchestrator', 'comms', 'fleet-status.json')) ?? {});
            return;
        }
        if (url === '/api/board') {
            sendJson(readJson(path.join(opts.workspaceRoot, '.autoclaw', 'orchestrator', 'board.json')) ?? {});
            return;
        }
        if (url === '/api/reviews') {
            sendJson(readReviewView(opts.workspaceRoot));
            return;
        }
        if (url === '/api/control') {
            sendJson({ commands: readControlStates(opts.workspaceRoot) });
            return;
        }
        res.writeHead(404).end('not found');
    });
}
/** Start the web UI on a dedicated loopback port. `port: 0` binds an ephemeral
 *  port; the returned handle carries the ACTUAL bound port. */
async function startWebUi(opts) {
    const host = opts.host ?? '127.0.0.1';
    const requestedPort = opts.port ?? exports.DAEMON_WEBUI_PORT_DEFAULT;
    const server = createWebUiServer({ workspaceRoot: opts.workspaceRoot, publicBaseUrl: opts.publicBaseUrl, requireAuth: opts.requireAuth });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(requestedPort, host, () => { server.removeListener('error', reject); resolve(); });
    });
    const addr = server.address();
    const port = addr && typeof addr === 'object' ? addr.port : requestedPort;
    const stop = () => new Promise((resolve) => server.close(() => resolve()));
    return { server, port, stop };
}
//# sourceMappingURL=webui.js.map