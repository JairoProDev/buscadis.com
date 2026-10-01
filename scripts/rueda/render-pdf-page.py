#!/usr/bin/env python3
"""Render one PDF page to PNG. Usage: render-pdf-page.py <pdf> <page_1based> <out.png> [dpi]"""
import sys

import pymupdf


def main() -> None:
    if len(sys.argv) < 4:
        print("Usage: render-pdf-page.py <pdf> <page> <out.png> [dpi]", file=sys.stderr)
        sys.exit(1)
    path, page_s, out, *rest = sys.argv[1:]
    dpi = int(rest[0]) if rest else 160
    page_i = int(page_s) - 1
    doc = pymupdf.open(path)
    if page_i < 0 or page_i >= doc.page_count:
        sys.exit(2)
    pix = doc[page_i].get_pixmap(dpi=dpi, alpha=False)
    pix.save(out)


if __name__ == "__main__":
    main()
