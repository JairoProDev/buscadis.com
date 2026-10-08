#!/usr/bin/env python3
"""Read edition metadata from page 1 of a Rueda PDF. JSON to stdout."""
import json
import re
import sys

import pymupdf


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: pdf-edition-meta.py <path.pdf>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    doc = pymupdf.open(path)
    page_count = doc.page_count
    text = doc[0].get_text() if page_count else ""
    doc.close()

    edicion = None
    m_ed = re.search(r"Edici[oó]n\s*(?:N[ºo°]?\s*)?(\d{3,4})", text, re.I)
    if m_ed:
        edicion = f"R{m_ed.group(1)}"
    if not edicion:
        m_file = re.search(r"\bR(\d{3,4})\b", path)
        if m_file:
            edicion = f"R{m_file.group(1)}"

    fechas = None
    m_cusco = re.search(
        r"Cusco,?\s+([\d\s,y alde]+?)\s+de\s+(\w+)\s+del\s+(\d{4})",
        text,
        re.I,
    )
    if m_cusco:
        fechas = {
            "raw": m_cusco.group(0),
            "mes": m_cusco.group(2),
            "anio": m_cusco.group(3),
        }

    out = {
        "path": path,
        "page_count": page_count,
        "edicion_detectada": edicion,
        "fechas_cabecera": fechas,
        "chars_page1": len(text.strip()),
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
