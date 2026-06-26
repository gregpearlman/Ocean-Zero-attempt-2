#!/usr/bin/env bash
set -euo pipefail

# Netlify build entry point. Generates deploy metadata + history.
# Never overwrites committed data files (so live data survives every deploy).

# version.js — deploy time + commit + branch (drives the "last updated" banner)
printf 'window.SITE_VERSION={lastUpdated:"%s",commitSha:"%s",branch:"%s"};\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${COMMIT_REF:0:7}" \
  "${BRANCH:-main}" > version.js

# Netlify clones shallow by default; unshallow so we can read full history.
if [ -f .git/shallow ]; then
  git fetch --unshallow 2>/dev/null || git fetch --depth=500 2>/dev/null || true
fi

# history.js from git log (only if you add scripts/build-history.py)
if [ -f scripts/build-history.py ]; then
  python3 scripts/build-history.py > history.js
fi

# Optional: build-time live-data pulls go here. Design them to skip WITHOUT
# overwriting the committed file when credentials are absent, e.g.:
#   python3 scripts/build-fund-performance.py || true
