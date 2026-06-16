/* app.js — all rendering + interactions for the VC HQ static site.
 * This is a MINIMAL but working starting point. Grow it as you add views.
 * Pattern: read the global arrays from data.js, build HTML strings, inject them.
 */
'use strict';

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byId = (arr, id) => arr.find(x => x.id === id) || {};

/* ---------- apply the edits.js overlay over data.js ---------- */
(function applyOverlay() {
  const ov = window.SITE_EDITS || {};
  const merge = (arr, edits) => {
    if (!arr || !edits) return;
    for (const rec of arr) if (edits[rec.id]) Object.assign(rec, edits[rec.id]);
  };
  merge(window.COMPANIES, ov.companies);
  merge(window.INVESTORS, ov.investors);
  // pairings are keyed by rank in the overlay
  if (window.PAIRINGS && ov.pairings)
    for (const p of window.PAIRINGS) if (ov.pairings[p.rank]) Object.assign(p, ov.pairings[p.rank]);
})();

/* ---------- dashboard ---------- */
// Optional: per-company urgency/state. Key MUST match COMPANIES id exactly.
const ROUND_STATUS = window.ROUND_STATUS || {
  // 'acme-fusion': { urgency:'hot', statusLabel:'$40M Series A', state:'Lead in DD.' }
};
const URGENCY_ORDER = { hot: 0, warm: 1, cold: 2 };

function renderDashboard() {
  const grid = $('#round-status-grid');
  const sorted = [...COMPANIES].sort((a, b) => {
    const ua = URGENCY_ORDER[(ROUND_STATUS[a.id] || {}).urgency] ?? 3;
    const ub = URGENCY_ORDER[(ROUND_STATUS[b.id] || {}).urgency] ?? 3;
    return ua - ub;
  });
  grid.innerHTML = sorted.map(c => {
    const rs = ROUND_STATUS[c.id] || {};
    const u = rs.urgency || 'cold';
    return `<div class="round-tile" data-company="${esc(c.id)}">
      <div class="rt-name"><span class="urgency-dot u-${u}"></span>${esc(c.name)}</div>
      <div class="rt-sector">${esc(c.sector)} · ${esc(c.stage)}</div>
      <div class="rt-status">${esc(rs.statusLabel || c.status || '')}</div>
      <div class="rt-state">${esc(rs.state || c.tagline || '')}</div>
    </div>`;
  }).join('');
  $('#dash-summary').textContent = `${COMPANIES.length} companies`;
  $$('.round-tile', grid).forEach(t =>
    t.addEventListener('click', () => t.classList.toggle('open')));

  const v = window.SITE_VERSION || {};
  $('#version-banner').textContent = v.lastUpdated
    ? `Last deploy ${v.lastUpdated} · ${v.commitSha || ''}` : '';
}

/* ---------- companies ---------- */
function renderCompanies() {
  $('#companies-grid').innerHTML = COMPANIES.map(c => `
    <div class="card">
      <h3>${esc(c.name)}</h3>
      <div class="c-meta">${esc(c.sector)} · ${esc(c.stage)} · ${esc(c.hq || '')}</div>
      <p>${esc(c.tagline || '')}</p>
      <p style="margin-top:8px;color:var(--text-dim)">${esc(c.status || '')}</p>
    </div>`).join('');
}

/* ---------- investors ---------- */
function renderInvestors() {
  const q = ($('#investors-search').value || '').toLowerCase();
  const rows = INVESTORS.filter(i =>
    !q || (i.name + ' ' + (i.thesis || '') + ' ' + (i.hq || '')).toLowerCase().includes(q));
  $('#investors-grid').innerHTML = rows.map(i => `
    <div class="card">
      <h3>${esc(i.name)} ${i.verified ? '<span class="tier-badge tier-1">✓</span>' : ''}</h3>
      <div class="c-meta">${esc(i.hq || '')} · ${esc(i.ticket || '')}</div>
      <p>${esc(i.thesis || '')}</p>
    </div>`).join('') || `<p class="lede">No matches.</p>`;
}

/* ---------- pairings ---------- */
function tierBadge(t) {
  const cls = t === 'avoid' ? 'tier-avoid' : `tier-${t}`;
  const label = t === 'avoid' ? 'Avoid' : `Tier ${t}`;
  return `<span class="tier-badge ${cls}">${label}</span>`;
}
function renderPairings() {
  const q = ($('#pairings-search').value || '').toLowerCase();
  const tf = $('#pairings-tier-filter').value;
  const rows = [...PAIRINGS]
    .filter(p => tf === 'all' || String(p.tier) === tf)
    .filter(p => {
      if (!q) return true;
      const inv = byId(INVESTORS, p.investor).name || p.investor;
      const co = byId(COMPANIES, p.company).name || p.company;
      return (inv + ' ' + co + ' ' + (p.killerAngle || '')).toLowerCase().includes(q);
    })
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  $('#pairings-table tbody').innerHTML = rows.map(p => {
    const inv = byId(INVESTORS, p.investor).name || p.investor;
    const co = byId(COMPANIES, p.company).name || p.company;
    const c = p.contact ? esc(p.contact) +
      (p.contactLinkedIn ? ` <a href="${esc(p.contactLinkedIn)}" target="_blank" rel="noopener">in↗</a>` : '') : '';
    return `<tr>
      <td>${p.tier === 'avoid' ? '—' : esc(p.rank)}</td>
      <td>${tierBadge(p.tier)}</td>
      <td>${esc(inv)}</td>
      <td>${esc(co)}</td>
      <td>${esc(p.conviction ?? '')}</td>
      <td>${esc(p.killerAngle || '')}</td>
      <td>${esc(p.checkAsk || '')}</td>
      <td>${c}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="8">No matches.</td></tr>`;
}

/* ---------- router ---------- */
const VIEWS = {
  dashboard: renderDashboard,
  companies: renderCompanies,
  investors: renderInvestors,
  pairings: renderPairings
};
function route() {
  const view = (location.hash.replace('#', '') || 'dashboard').split('/')[0];
  const name = VIEWS[view] ? view : 'dashboard';
  $$('.view').forEach(s => s.classList.toggle('active', s.id === `view-${name}`));
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  (VIEWS[name] || renderDashboard)();
  $('#sidebar').classList.remove('open');           // close mobile nav on nav
}

/* ---------- wire up ---------- */
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  $('#investors-search').addEventListener('input', renderInvestors);
  $('#pairings-search').addEventListener('input', renderPairings);
  $('#pairings-tier-filter').addEventListener('change', renderPairings);
  $('#hamburger')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#sidebar-backdrop')?.addEventListener('click', () => $('#sidebar').classList.remove('open'));
  route();
});
