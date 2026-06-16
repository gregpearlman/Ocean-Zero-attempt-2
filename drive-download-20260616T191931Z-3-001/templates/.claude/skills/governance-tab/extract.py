#!/usr/bin/env python3
"""Extract plain text from a governance source document (PDF or DOCX).

Usage:
    python3 .claude/skills/governance-tab/extract.py <file> [<file> ...]

Writes /tmp/gov-extract/<stem>.txt for each input and prints a one-line summary.
  - PDFs use pypdf, auto-installing it and repairing the cffi backend if needed
    (this container ships a broken `cryptography` rust binding that pypdf's init
    imports — reinstalling cffi fixes the `_cffi_backend` panic).
  - DOCX uses only the standard library (unzip word/document.xml + strip tags).
  - A near-empty PDF result is flagged as a likely scanned/image PDF (needs OCR;
    fall back to the other documents or ask for a text copy).

After extracting, grep the .txt for clause headings to map the document, e.g.:
    grep -niE "reserved matter|board|quorum|director|drag|tag|pre-?emption|\
resolution|class of share|transfer|votes?" /tmp/gov-extract/<stem>.txt
"""
import sys, os, re, html, subprocess, zipfile

OUT = "/tmp/gov-extract"


def ensure_pypdf():
    try:
        import pypdf  # noqa: F401
        return
    except Exception:
        pass
    # cryptography's rust binding panics when _cffi_backend is missing; repair cffi first.
    subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                    "--force-reinstall", "--no-cache-dir", "cffi"], check=False)
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pypdf"], check=False)
    import pypdf  # noqa: F401


def extract_pdf(path):
    ensure_pypdf()
    from pypdf import PdfReader
    r = PdfReader(path)
    if r.is_encrypted:
        try:
            r.decrypt("")
        except Exception:
            pass
    pages = []
    for p in r.pages:
        try:
            pages.append(p.extract_text() or "")
        except Exception as e:
            pages.append(f"[extract error: {e}]")
    return "\n".join(pages), len(r.pages)


def extract_docx(path):
    z = zipfile.ZipFile(path)
    xml = z.read("word/document.xml").decode("utf-8", "replace")
    xml = xml.replace("</w:p>", "\n").replace("<w:tab/>", "\t").replace("<w:br/>", "\n")
    text = html.unescape(re.sub(r"<[^>]+>", "", xml))
    text = re.sub(r"\n[ \t]+\n", "\n\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text, text.count("\n") + 1


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    os.makedirs(OUT, exist_ok=True)
    for path in sys.argv[1:]:
        ext = os.path.splitext(path)[1].lower()
        try:
            if ext == ".pdf":
                text, n = extract_pdf(path)
            elif ext == ".docx":
                text, n = extract_docx(path)
            else:
                print(f"SKIP {path}: unsupported extension '{ext}' "
                      f"(handles .pdf/.docx — convert .doc/.xlsx/.pages first)")
                continue
        except Exception as e:
            print(f"ERROR {path}: {e}")
            continue
        stem = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(path))
        out = os.path.join(OUT, stem + ".txt")
        with open(out, "w") as f:
            f.write(text)
        # A real text page runs to thousands of chars; < ~200/page means no usable text layer.
        scanned = ext == ".pdf" and len(text.strip()) < 200 * max(n, 1)
        flag = "  ⚠ very little text — likely a scanned/image PDF (needs OCR)" if scanned else ""
        print(f"OK {os.path.basename(path)} -> {out}  ({n} pages/units, {len(text)} chars){flag}")


if __name__ == "__main__":
    main()
