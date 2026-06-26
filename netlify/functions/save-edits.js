// Netlify Function: commit the in-browser edit overlay back to the repo.
// Security model:
//   - The GitHub token lives ONLY in the GITHUB_TOKEN env var (server-side, never shipped).
//   - Writes require the caller to present EDIT_KEY (shared secret, set as a Netlify env var)
//     in the x-edit-key header. Without the matching key the function refuses.
//   - The token should be a fine-grained PAT scoped to ONLY this repo, Contents: read+write.
// Env vars to set in Netlify (Site settings → Environment variables):
//   GITHUB_TOKEN  – fine-grained PAT (your private repo, Contents R/W only)
//   EDIT_KEY      – any long random string; share with the team out-of-band
//   GITHUB_REPO   – your-fund/vc-hq  (set this, or change the default below)
//   GITHUB_BRANCH – optional, defaults to "main"

const REPO = process.env.GITHUB_REPO || 'your-fund/vc-hq';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE = 'edits.js';
const API = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(obj),
});

// Serialize the overlay object into the edits.js file body (same shape the browser reads).
function renderFile(overlay) {
  const banner = `// edits.js — committed overlay of in-browser edits (auto-written by save-edits).\n` +
    `// Hand-edit with care; the in-app editor rewrites this whole file on each save.\n`;
  return `${banner}window.SITE_EDITS = ${JSON.stringify(overlay, null, 2)};\n`;
}

// Deep field-level merge: apply `inc` onto `base`. Plain objects merge recursively; at the leaves
// `inc` wins. Keys present only in `base` are PRESERVED — so a browser tab that loaded an older
// edits.js can't drop edits saved (by another tab/session) since it loaded. Safe because the
// in-app editor only ever adds/updates overlay entries; it never deletes a saved field.
function deepMerge(base, inc) {
  if (!base || typeof base !== 'object' || Array.isArray(base)) return inc;
  const out = { ...base };
  for (const k of Object.keys(inc || {})) {
    const a = out[k], b = inc[k];
    out[k] = (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b))
      ? deepMerge(a, b) : b;
  }
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const KEY = process.env.EDIT_KEY;
  const TOKEN = process.env.GITHUB_TOKEN;
  if (!KEY || !TOKEN) return json(503, { error: 'Editing not configured (missing EDIT_KEY or GITHUB_TOKEN env var).' });
  if ((event.headers['x-edit-key'] || '') !== KEY) return json(401, { error: 'Bad edit key' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad JSON' }); }
  const overlay = payload.overlay;
  if (!overlay || typeof overlay !== 'object') return json(400, { error: 'Missing overlay' });
  // Basic shape guard — only the known keys, and not absurdly large.
  const ALLOWED = ['updatedAt', 'investors', 'pairings', 'companies', 'roundStatus', 'exaInvestorLead', 'lists'];
  for (const k of Object.keys(overlay)) if (!ALLOWED.includes(k)) return json(400, { error: `Unexpected key: ${k}` });
  const gh = async (url, opts = {}) => fetch(url, {
    ...opts,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'exa-vc-hq-editor',
      ...(opts.headers || {}),
    },
  });

  try {
    // Read the CURRENT committed overlay (sha + content) and MERGE the incoming overlay onto it,
    // instead of overwriting. A browser tab that loaded edits.js before another save/deploy would
    // otherwise PUT its stale full overlay and wipe edits saved in the meantime — the "edits got
    // rolled back" failure. The editor is add-only, so a field-level deep merge is lossless.
    // If the current file can't be read/parsed, fall back to a plain overwrite (current = {}).
    let sha, current = {};
    const cur = await gh(`${API}?ref=${BRANCH}`);
    if (cur.status === 200) {
      const data = await cur.json();
      sha = data.sha;
      try {
        const txt = Buffer.from(data.content || '', 'base64').toString('utf8');
        const m = txt.match(/window\.SITE_EDITS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
        if (m) current = JSON.parse(m[1]);
      } catch { current = {}; }
    } else if (cur.status !== 404) {
      return json(502, { error: `GitHub read failed (${cur.status})` });
    }

    const merged = deepMerge(current, overlay);
    merged.updatedAt = overlay.updatedAt || new Date().toISOString();
    const bodyStr = renderFile(merged);
    if (bodyStr.length > 2_000_000) return json(413, { error: 'Overlay too large' });

    const who = (payload.author || 'web editor').toString().slice(0, 60);
    const summary = (payload.summary || 'update site data').toString().slice(0, 100);
    const put = await gh(API, {
      method: 'PUT',
      body: JSON.stringify({
        message: `edits: ${summary}\n\nVia in-app editor (${who}).`,
        content: Buffer.from(bodyStr, 'utf8').toString('base64'),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!put.ok) {
      const t = await put.text();
      return json(502, { error: `GitHub write failed (${put.status})`, detail: t.slice(0, 300) });
    }
    const res = await put.json();
    return json(200, { ok: true, commit: res.commit && res.commit.sha });
  } catch (e) {
    return json(500, { error: 'Server error', detail: String(e).slice(0, 300) });
  }
};
