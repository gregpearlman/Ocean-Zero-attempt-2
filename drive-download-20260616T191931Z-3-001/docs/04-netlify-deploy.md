# 04 · Netlify Deploy

The site is hosted on Netlify and **auto-deploys on every push to `main`**. There's no build to babysit — a `git push` is live in ~30–60 seconds.

## One-time setup

1. **Create the site from GitHub.** In Netlify: *Add new site → Import an existing project → GitHub →* pick your repo.
2. **Accept the build settings.** They come from `netlify.toml` (shipped in the template) — you shouldn't need to type anything.
3. **Deploy.** The first build runs `scripts/build-meta.sh` and publishes the repo root.

```toml
# netlify.toml
[build]
  publish = "."                     # serve the repo root as-is
  command = "bash scripts/build-meta.sh"

[functions]
  directory = "netlify/functions"   # serverless functions live here

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
    X-Robots-Tag = "noindex, nofollow"   # never get crawled
```

## What the build does

`scripts/build-meta.sh` is the build entry point. On every deploy it:

1. Writes **`version.js`** — the deploy timestamp, commit SHA and branch (drives the "last updated" banner).
2. Generates **`history.js`** from `git log` (drives the History view).
3. *(Optional)* Pulls any live data (outreach trackers, fund sheet) if credentials are configured — and **skips gracefully without overwriting** the committed files if they're not.

Because the build *regenerates* `version.js`/`history.js` but *never overwrites* your committed data files when creds are absent, your real data always survives a deploy.

## Password protection

The site holds confidential data, so it must never be public.

- **Netlify Pro** ($19/mo): *Site configuration → Visitor access → Password protection →* set a **site-wide password**. Share it with your team out-of-band (not in the repo, not in email subject lines).
- The `X-Robots-Tag: noindex, nofollow` header (in `netlify.toml`) and `<meta name="robots" content="noindex">` keep it out of search engines as a second layer.

> If you can't use Pro, an alternative is Netlify's role-based access (Identity) or a serverless basic-auth function — but the simple site password is by far the least friction.

## Environment variables

Set these in *Site configuration → Environment variables*. **They live only in Netlify, never in the repo.**

| Var | Needed for | Notes |
|---|---|---|
| `GITHUB_TOKEN` | In-browser Edit mode | Fine-grained PAT scoped to **only this repo**, Contents: read+write |
| `EDIT_KEY` | In-browser Edit mode | Any long random string; the shared secret teammates enter to save edits |
| `GITHUB_REPO` / `GITHUB_BRANCH` | optional | Default to your repo / `main` |
| Drive/service creds | optional build-time data pull | Only if you use the build-time sync path instead of routines |

## Deploying

The normal path is just git:

```bash
git add -A
git commit -m "update Acme Fusion round state"
git push            # Netlify builds + deploys automatically
```

Always **rebase onto the latest `origin/main` before pushing** — this matters because of the `edits.js` guardrail (doc 07). A clean fast-forward push can never revert the in-browser edits.

A manual deploy (rarely needed) still works via the CLI:

```bash
npx netlify deploy --prod --dir=.
```

Next: **`05-connectors-and-mining.md`**.
