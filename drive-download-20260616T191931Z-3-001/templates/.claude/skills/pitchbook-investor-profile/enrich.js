// enrich.js — apply a declarative PitchBook enrichment patch to investor records
// in data.js, mutating each record's ONE-LINE JSON object safely (parse → mutate →
// re-serialize on the same line), then `node --check` the result.
//
// Usage:
//   node .claude/skills/pitchbook-investor-profile/enrich.js <patch.json> [data.js]
//
// patch.json maps each investor id (as it appears in data.js — mind the ID
// fragmentation gotcha, see SKILL.md) to a set of operations. All ops are optional:
//
// {
//   "future-ventures": {
//     "set":         { "hq": "Los Altos, CA, USA", "leadPartner": "…" },  // overwrite fields
//     "appendNote":  "PitchBook (29 May 2026): …",                        // ' | '-append to notes
//     "addPortfolio":["SpaceX (…)", "Neuralink (…)"],                     // dedup-append (by name)
//     "pitchbook":   { "asOf":"2026-05-29", "aum":"£444.72M", … }         // set the snapshot object
//   }
// }
//
// SAFETY: only `set` overwrites existing fields — use it deliberately. Prefer
// `appendNote` / `addPortfolio` so curated prose and prior verification survive.
// Never put investor email addresses in any field (CLAUDE.md guardrail #10).
//
// Exit non-zero (and write nothing) if any id is missing or any line fails to parse.

const fs = require('fs');
const cp = require('child_process');

const patchPath = process.argv[2];
const dataPath = process.argv[3] || 'data.js';
if (!patchPath) { console.error('usage: enrich.js <patch.json> [data.js]'); process.exit(2); }

const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const lines = fs.readFileSync(dataPath, 'utf8').split('\n');

const appendNote = (existing, add) => { const e = (existing || '').trim(); return e ? e + ' | ' + add : add; };
const addPortfolio = (arr, adds) => {
  arr = Array.isArray(arr) ? arr.slice() : [];
  for (const a of adds) {
    const key = String(a).split(' (')[0].toLowerCase().trim();
    if (!arr.some(x => String(x).toLowerCase().includes(key))) arr.push(a);
  }
  return arr;
};

function applyOps(obj, ops) {
  if (ops.set) Object.assign(obj, ops.set);
  if (ops.appendNote) obj.notes = appendNote(obj.notes, ops.appendNote);
  if (ops.addPortfolio) obj.portfolio = addPortfolio(obj.portfolio, ops.addPortfolio);
  if (ops.pitchbook) obj.pitchbook = ops.pitchbook;
  return obj;
}

const ids = Object.keys(patch);
const found = new Set();
const errors = [];

for (let idx = 0; idx < lines.length; idx++) {
  const line = lines[idx];
  for (const id of ids) {
    if (line.startsWith('{"id":"' + id + '",')) {
      if (found.has(id)) { errors.push(`duplicate line for id "${id}" (ID fragmentation? pick one)`); continue; }
      const tc = line.trimEnd().endsWith(',');
      let txt = line.trim(); if (tc) txt = txt.replace(/,\s*$/, '');
      let obj;
      try { obj = JSON.parse(txt); } catch (e) { errors.push(`parse fail for "${id}": ${e.message}`); continue; }
      lines[idx] = JSON.stringify(applyOps(obj, patch[id])) + (tc ? ',' : '');
      found.add(id);
      console.log(`enriched ${id} → ${lines[idx].length} chars`);
    }
  }
}

for (const id of ids) if (!found.has(id)) errors.push(`id "${id}" not found in ${dataPath} (add the record first, or fix the id)`);
if (errors.length) { console.error('ABORT — wrote nothing:\n - ' + errors.join('\n - ')); process.exit(1); }

fs.writeFileSync(dataPath, lines.join('\n'));
try { cp.execFileSync('node', ['--check', dataPath], { stdio: 'pipe' }); }
catch (e) { console.error(`WROTE ${dataPath} but it FAILS node --check:\n${e.stderr || e.message}`); process.exit(1); }
console.log(`OK wrote ${dataPath} (${found.size} record(s)); node --check passed.`);
