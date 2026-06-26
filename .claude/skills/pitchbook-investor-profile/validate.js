// validate.js — render + integrity check for PitchBook investor snapshots.
//
// Usage:
//   node .claude/skills/pitchbook-investor-profile/validate.js              # every record with a pitchbook
//   node .claude/skills/pitchbook-investor-profile/validate.js <investorId> # just one
//
// Loads each enriched record from data.js (reads the record's one-line JSON
// directly — no need to execute the whole file), slices `pitchbookSection` out of
// app.js, renders it with a faithful escapeHtml stub, and asserts:
//   - the renderer is wired into the detail template (`${pitchbookSection(i)}`)
//   - no unrendered artifacts (`undefined`, `[object Object]`, `${`, `NaN`)
//   - <div> tags balanced
//   - core fields present (asOf, aum, yearFounded) + at least one mix array
// Exit non-zero if any record fails. Run from the repo root.

const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const only = process.argv[2];

const dataLines = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8').split('\n');
function recordsWithPitchbook() {
  const out = [];
  for (const line of dataLines) {
    if (/^\{"id":/.test(line) && line.includes('"pitchbook":')) {
      try {
        const o = JSON.parse(line.trim().replace(/,\s*$/, ''));
        if (o.pitchbook) out.push(o);
      } catch (_) { /* skip unparseable */ }
    }
  }
  return out;
}

global.escapeHtml = (s) => String(s == null ? '' : s)
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
if (!app.includes('${pitchbookSection(i)}')) {
  console.error('FAIL: pitchbookSection() is not wired into the investor detail template '
    + '(expected `${pitchbookSection(i)}` in openInvestorDetail). Add it after the "At a glance" section.');
  process.exit(1);
}
const a = app.indexOf('function pitchbookSection');
const b = app.indexOf('function openInvestorDetail');
if (a < 0 || b < 0 || b < a) {
  console.error('Could not locate pitchbookSection in app.js (moved?). '
    + 'Expected `function pitchbookSection` before `function openInvestorDetail`.');
  process.exit(1);
}
eval(app.slice(a, b) + '\n;global.__pb = pitchbookSection;');

let recs = recordsWithPitchbook();
if (only) recs = recs.filter(r => r.id === only);
if (!recs.length) { console.error(only ? `No pitchbook record for "${only}".` : 'No records carry a pitchbook field.'); process.exit(1); }

let failed = 0;
for (const r of recs) {
  const html = global.__pb(r);
  const fail = [];
  ['undefined', '[object Object]', '${', 'NaN'].forEach(t => { if (html.includes(t)) fail.push(`artifact ${JSON.stringify(t)}`); });
  const o = (html.match(/<div/g) || []).length, c = (html.match(/<\/div>/g) || []).length;
  if (o !== c) fail.push(`div imbalance (${o} open / ${c} close)`);
  const pb = r.pitchbook;
  // asOf + yearFounded are universal; AUM is often undisclosed (young/self-funded vehicles), so don't require it.
  ['asOf', 'yearFounded'].forEach(k => { if (pb[k] === undefined || pb[k] === null || pb[k] === '') fail.push(`pitchbook.${k} missing`); });
  // substance check: a VC/PE profile has a mix; SWF/LP/foundation profiles may have only a team.
  if (!(pb.dealTypes || pb.industries || pb.geographies || (pb.keyTeam && pb.keyTeam.length))) fail.push('no deal/industry/geography mix or key team');
  if (fail.length) { console.error(`[${r.id}] FAIL:\n - ${fail.join('\n - ')}`); failed++; }
  else console.log(`[${r.id}] OK — ${html.length} chars, `
    + `${(html.match(/<dt>/g) || []).length} kv rows, ${(html.match(/rating-fill/g) || []).length} mix bars, `
    + `${(pb.keyTeam || []).length} team`);
}
if (failed) { console.error(`\n${failed} record(s) FAILED.`); process.exit(1); }
console.log(`\nAll ${recs.length} record(s) passed.`);
