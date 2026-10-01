#!/usr/bin/env python3
"""Extract per-page text from a Rueda PDF. Outputs JSON to stdout."""
import json
import sys

import pymupdf


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: pdf-pages-text.py <path.pdf>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    doc = pymupdf.open(path)
    pages = [{"pagina": i + 1, "texto": doc[i].get_text()} for i in range(doc.page_count)]
    json.dump({"path": path, "page_count": doc.page_count, "pages": pages}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
