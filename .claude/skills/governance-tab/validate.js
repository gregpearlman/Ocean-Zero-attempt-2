// validate.js — render + guardrail check for governance profiles.
//
// Usage:
//   node .claude/skills/governance-tab/validate.js              # validate every company
//   node .claude/skills/governance-tab/validate.js <companyId>  # validate one
//
// It loads governance.js, slices the governance render functions out of app.js
// (between the "// ====== Governance tab" marker and `function renderCompanyPage`),
// renders each profile to HTML with a faithful escapeHtml stub, and asserts:
//   - no unrendered template artifacts (`undefined`, `[object Object]`, `${`, `NaN`)
//   - <section> tags balanced
//   - every instruments[].economicNotes string is ABSENT from the render
//     (the internal-only guardrail: caps / investor names / £ must not reach the tab)
// Exit code is non-zero if any company fails. Run from the repo root.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const only = process.argv[2];

global.window = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'governance.js'), 'utf8') + '\n')(global.window);
const GOV = global.window.GOVERNANCE || {};

global.escapeHtml = (s) => String(s == null ? '' : s)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const a = app.indexOf('// ====== Governance tab');
const b = app.indexOf('function renderCompanyPage(id, slug) {');
if (a < 0 || b < 0 || b < a) {
  console.error('Could not locate the governance block in app.js (markers moved?). ' +
    'Expected "// ====== Governance tab" ... before "function renderCompanyPage(id, slug) {".');
  process.exit(1);
}
eval(app.slice(a, b) + '\n;global.__gov = { companyGovernancePage };');

const ids = only ? [only] : Object.keys(GOV);
if (!ids.length) { console.error('No governance profiles found.'); process.exit(1); }

let failed = 0;
for (const id of ids) {
  const prof = GOV[id];
  if (!prof) { console.error(`[${id}] FAIL: no GOVERNANCE['${id}']`); failed++; continue; }
  const html = global.__gov.companyGovernancePage({ id, name: id });
  const fail = [];
  ['undefined', '[object Object]', '${', 'NaN'].forEach((t) => {
    if (html.includes(t)) fail.push(`artifact ${JSON.stringify(t)}`);
  });
  const so = (html.match(/<section/g) || []).length;
  const sc = (html.match(/<\/section>/g) || []).length;
  if (so !== sc) fail.push(`section imbalance (${so} open / ${sc} close)`);
  (prof.instruments || []).forEach((i, ix) => {
    if (i.economicNotes && html.includes(i.economicNotes)) fail.push(`economicNotes[${ix}] LEAKED into the rendered tab`);
  });
  if (!prof.company || !prof.company.legalName) fail.push('company.legalName missing');
  if (!prof.disclaimer) fail.push('disclaimer missing');
  if (fail.length) { console.error(`[${id}] FAIL:\n - ${fail.join('\n - ')}`); failed++; }
  else console.log(`[${id}] OK — ${html.length} chars, ${so} sections, ` +
    `${(prof.decisions || []).length} decisions, ${(prof.instruments || []).length} instruments`);
}
if (failed) { console.error(`\n${failed} profile(s) FAILED.`); process.exit(1); }
console.log(`\nAll ${ids.length} profile(s) passed.`);
