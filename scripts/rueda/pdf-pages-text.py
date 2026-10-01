#!/usr/bin/env python3
"""Extract per-page text from a Rueda PDF (multi-column + optional OCR). Outputs JSON to stdout."""
import json
import sys
from typing import List, Tuple

import pymupdf


def _lines_from_page(page: pymupdf.Page) -> List[Tuple[float, float, float, str]]:
    items: List[Tuple[float, float, float, str]] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(span.get("text", "") for span in line.get("spans", [])).strip()
            if not text:
                continue
            bbox = line["bbox"]
            items.append((bbox[0], bbox[1], bbox[2], text))
    return items


def extract_columns(page: pymupdf.Page, ncol: int = 3) -> str:
    """Reading order: top-to-bottom within each column, columns left-to-right."""
    items = _lines_from_page(page)
    if not items:
        return ""
    width = float(page.rect.width)
    cols: List[List[Tuple[float, str]]] = [[] for _ in range(ncol)]
    col_w = width / ncol if width > 0 else 1.0
    for x0, y0, _x1, text in items:
        col = min(ncol - 1, int(x0 / col_w) if col_w > 0 else 0)
        cols[col].append((y0, text))
    parts: List[str] = []
    for col in cols:
        col.sort(key=lambda t: t[0])
        parts.append("\n".join(t[1] for t in col))
    return "\n\n".join(parts)


def extract_sorted(page: pymupdf.Page) -> str:
    items = _lines_from_page(page)
    items.sort(key=lambda t: (round(t[1] / 6), t[0]))
    return "\n".join(t[3] for t in items)


def extract_plain(page: pymupdf.Page) -> str:
    return page.get_text()


def extract_ocr(page: pymupdf.Page) -> str:
    try:
        tp = page.get_textpage_ocr(dpi=200, full=True, language="spa")
        return page.get_text(textpage=tp)
    except Exception:
        return ""


def pick_best_text(page: pymupdf.Page, use_ocr: bool) -> str:
    candidates = [
        extract_plain(page),
        extract_columns(page, 3),
        extract_columns(page, 2),
        extract_sorted(page),
    ]
    if use_ocr:
        ocr = extract_ocr(page)
        if ocr.strip():
            candidates.append(ocr)
    # Prefer richest layer; tie-break with more phone-like tokens
    def score(t: str) -> tuple:
        import re

        phones = len(re.findall(r"9\d{8}", t.replace(" ", "")))
        return (phones, len(t.strip()))

    return max(candidates, key=score)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: pdf-pages-text.py <path.pdf> [--ocr]", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    use_ocr = "--ocr" in sys.argv
    doc = pymupdf.open(path)
    pages = []
    for i in range(doc.page_count):
        page = doc[i]
        texto = pick_best_text(page, use_ocr)
        pages.append(
            {
                "pagina": i + 1,
                "texto": texto,
                "chars": len(texto),
                "images": len(page.get_images()),
            }
        )
    json.dump(
        {"path": path, "page_count": doc.page_count, "pages": pages, "ocr": use_ocr},
        sys.stdout,
        ensure_ascii=False,
    )


if __name__ == "__main__":
    main()
