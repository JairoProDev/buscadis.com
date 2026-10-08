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

    MONTH_ES = {
        "enero": 1,
        "febrero": 2,
        "marzo": 3,
        "abril": 4,
        "mayo": 5,
        "junio": 6,
        "julio": 7,
        "agosto": 8,
        "setiembre": 9,
        "septiembre": 9,
        "octubre": 10,
        "noviembre": 11,
        "diciembre": 12,
    }
    MONTH_ABBR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    fechas = None
    fecha_inicio = None
    fecha_fin = None
    rango_label = None

    m_cusco = re.search(
        r"Cusco,?\s+([\d\s,y alde]+?)\s+de\s+(\w+)\s+del\s+(\d{4})",
        text,
        re.I,
    )
    m_rango = re.search(
        r"Cusco,?\s+del\s+(\d{1,2})\s+de\s+(\w+)\s+al\s+(\d{1,2})\s+de\s+(\w+)\s+del\s+(\d{4})",
        text,
        re.I,
    )
    if m_cusco:
        raw_days = m_cusco.group(1)
        mes_name = m_cusco.group(2).lower()
        anio = int(m_cusco.group(3))
        days = [int(x) for x in re.findall(r"\d+", raw_days)]
        month = MONTH_ES.get(mes_name)
        fechas = {
            "raw": m_cusco.group(0),
            "mes": m_cusco.group(2),
            "anio": str(anio),
            "days": days,
        }
        if month and days:
            d1, d2 = min(days), max(days)
            fecha_inicio = f"{anio}-{month:02d}-{d1:02d}"
            fecha_fin = f"{anio}-{month:02d}-{d2:02d}"
            abbr = MONTH_ABBR[month - 1]
            rango_label = f"{abbr}{d1}-{d2}" if d1 != d2 else f"{abbr}{d1}"

    if m_rango and not fecha_inicio:
        d1 = int(m_rango.group(1))
        mes1 = MONTH_ES.get(m_rango.group(2).lower())
        d2 = int(m_rango.group(3))
        mes2 = MONTH_ES.get(m_rango.group(4).lower())
        anio_fin = int(m_rango.group(5))
        if mes1 and mes2:
            anio_ini = anio_fin if mes1 <= mes2 else anio_fin - 1
            fecha_inicio = f"{anio_ini}-{mes1:02d}-{d1:02d}"
            fecha_fin = f"{anio_fin}-{mes2:02d}-{d2:02d}"
            abbr1 = MONTH_ABBR[mes1 - 1]
            abbr2 = MONTH_ABBR[mes2 - 1]
            rango_label = (
                f"{abbr1}{d1}-{abbr2}{d2}" if mes1 != mes2 else f"{abbr1}{d1}-{d2}"
            )
            fechas = {
                "raw": m_rango.group(0),
                "tipo": "rango_cross_month",
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
            }

    out = {
        "path": path,
        "page_count": page_count,
        "edicion_detectada": edicion,
        "fechas_cabecera": fechas,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "rango_label": rango_label,
        "chars_page1": len(text.strip()),
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
