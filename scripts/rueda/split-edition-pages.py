#!/usr/bin/env python3
"""
Split a Rueda edition PDF into per-page PDFs (+ optional PNG).
Usage: split-edition-pages.py <edition.pdf> <out_dir> [--png] [--dpi=150]
Writes meta.json in out_dir.
"""
import json
import hashlib
import sys
from pathlib import Path

import pymupdf


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    if len(args) < 2:
        print("Usage: split-edition-pages.py <pdf> <out_dir> [--png] [--dpi=150]", file=sys.stderr)
        sys.exit(1)
    pdf_path, out_dir = args[0], args[1]
    with_png = "--png" in flags
    dpi = 150
    for f in flags:
        if f.startswith("--dpi="):
            dpi = int(f.split("=", 1)[1])

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    parent_sha = sha256_file(pdf_path)
    meta_path = out / "meta.json"
    if meta_path.exists():
        existing = json.loads(meta_path.read_text())
        if existing.get("sha256_parent") == parent_sha and existing.get("page_count"):
            print(json.dumps({"skipped": True, "reason": "unchanged", "out_dir": str(out)}))
            return

    doc = pymupdf.open(pdf_path)
    page_count = doc.page_count
    for i in range(page_count):
        single = pymupdf.open()
        single.insert_pdf(doc, from_page=i, to_page=i)
        name = f"pagina-{i + 1:02d}.pdf"
        single.save(out / name)
        single.close()
        if with_png:
            page = doc[i]
            pix = page.get_pixmap(dpi=dpi)
            pix.save(str(out / f"pagina-{i + 1:02d}.png"))
    doc.close()

    meta = {
        "sha256_parent": parent_sha,
        "source_pdf": str(Path(pdf_path).resolve()),
        "page_count": page_count,
        "split_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "with_png": with_png,
        "dpi": dpi if with_png else None,
    }
    meta_path.write_text(json.dumps(meta, indent=2) + "\n")
    print(json.dumps({"ok": True, "page_count": page_count, "out_dir": str(out)}))


if __name__ == "__main__":
    main()
