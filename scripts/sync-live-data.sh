#!/usr/bin/env bash
# Restore out-of-band-written files (edits.js) from live origin/main.
# Run this if the pre-push hook blocks you because edits.js drifted.
set -eu

PROTECTED="edits.js"

git fetch -q origin main
for f in $PROTECTED; do
  if git cat-file -e "origin/main:$f" 2>/dev/null; then
    git checkout origin/main -- "$f"
    echo "restored $f from origin/main"
  fi
done
echo "Done. Now: git commit --amend --no-edit  (or rebase onto origin/main) and push again."
