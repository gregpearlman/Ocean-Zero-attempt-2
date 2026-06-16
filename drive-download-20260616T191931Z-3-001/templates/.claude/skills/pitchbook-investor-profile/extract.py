#!/usr/bin/env python3
"""Extract plain text from a PitchBook investor-profile PDF, layout-preserved.

Usage:
    python3 .claude/skills/pitchbook-investor-profile/extract.py <file.pdf> [<file.pdf> ...]

Writes /tmp/pb-extract/<stem>.txt for each input and prints a one-line summary.

PitchBook profiles are COLUMNAR (the "General Information" firmographics block,
the team tables, and the deal tables are all multi-column). So this uses
`pdftotext -layout` (poppler) — which keeps columns aligned — NOT pypdf, whose
flat extraction interleaves the columns and is unreadable for these tables.
poppler-utils is auto-installed via apt if `pdftotext` is missing.

After extracting, map the profile by reading these sections (the data you need
lives in the first ~150 lines plus the deal/exit tables):
    grep -niE "general information|website|entity type|legal name|investor type|\\
investor status|year founded|aum|dry powder|total investments|active portfolio|\\
median|professionals|trade association|primary contact|current team|\\
lead partners|all investments|exits" /tmp/pb-extract/<stem>.txt
"""
import sys, os, re, shutil, subprocess

OUT = "/tmp/pb-extract"


def ensure_pdftotext():
    if shutil.which("pdftotext"):
        return True
    # Try apt (this container runs as root). Best-effort; report clearly if it fails.
    for cmd in (["apt-get", "install", "-y", "--quiet", "poppler-utils"],
                ["sudo", "apt-get", "install", "-y", "--quiet", "poppler-utils"]):
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            if shutil.which("pdftotext"):
                return True
        except Exception:
            continue
    return shutil.which("pdftotext") is not None


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    if not ensure_pdftotext():
        print("ERROR: pdftotext (poppler-utils) is not installed and could not be "
              "auto-installed. Install it (`apt-get install poppler-utils` / "
              "`brew install poppler`) and retry.")
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    for path in sys.argv[1:]:
        if os.path.splitext(path)[1].lower() != ".pdf":
            print(f"SKIP {path}: not a .pdf (PitchBook exports are PDF)")
            continue
        stem = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(path))
        out = os.path.join(OUT, stem + ".txt")
        try:
            subprocess.run(["pdftotext", "-layout", path, out], check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"ERROR {path}: pdftotext failed — {e.stderr.decode('utf-8', 'replace')[:200]}")
            continue
        text = open(out, encoding="utf-8", errors="replace").read()
        nlines = text.count("\n") + 1
        # A real PitchBook profile runs to thousands of chars; near-empty => scanned/secured PDF.
        scanned = len(text.strip()) < 400
        flag = "  ⚠ very little text — secured or scanned PDF (no text layer)" if scanned else ""
        print(f"OK {os.path.basename(path)} -> {out}  ({nlines} lines, {len(text)} chars){flag}")


if __name__ == "__main__":
    main()
