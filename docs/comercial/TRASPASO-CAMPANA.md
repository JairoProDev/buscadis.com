# Contexto de traspaso — campaña Buscadis × Rueda

**Corte documento Claude:** 4 oct 2026.  
**CRM vivo:** `/admin/comercial` + `data/comercial/campana-rueda-oct-2026.json`.

Leer primero en operación diaria: **§6 clientes activos**, **§8 cobros**, **§16 archivos** (este doc resume; detalle en JSON + Supabase).

## Qué ya está en el repo

- Pipeline ~62 prospectos importados (`metadata.campaign = rueda-negocios-2026-10`)
- ~340 leads `source=rueda` = PDF R2764, **no** contacto masivo
- Planes: `OFERTA-PLANES.md` + flyers JPG
- Cobro empresa: ADIS TECHNOLOGICAL PLATFORMS S.A.C., RUC **20614390779**, Interbank **420-3008882613**, CCI **003-420-003008882613-73**
- Restricción WA Business 24 h (3 oct); ritmo **10–15 chats nuevos/día**, personalizados
- Enlaces `wa.me` sin emojis en el texto (se corrompen)

## Conflictos / dudas — elegir verdad

Marca la opción correcta (o escríbeme la cifra/dato) para actualizar JSON + CRM.

### A. Volumen de campaña

| # | Tema | Opciones |
|---|------|----------|
| A1 | ¿Cuántos contactos únicos con mensaje saliente? | (1) ~60 en CRM (2) ~80–90 como dijiste (3) 100–110 del traspaso (4) otro: ___ |

### B. Pagos y comprobantes

| # | Tema | Opciones |
|---|------|----------|
| B1 | **Black Llama** | (1) Sigue sin pagar, solo factura E001-1 (2) Ya abonó en Interbank (fecha: ___) |
| B2 | **Servicios Varios** factura SUNAT | (1) Total S/30 correcto (2) Se emitió mal S/42,37 — anular y reemitir (3) otro |
| B3 | **Mapacho / Casa Carbajal** Yape personal | (1) Dejar así y consultar contador (2) Ya emitiste boleta/factura (3) Reembolso y cobro a empresa |
| B4 | **Medio de cobro estándar** desde ahora | (1) Solo Interbank CCI (2) Plin empresa cuando exista (3) Yape Empresas Shantall temporal |

### C. Teléfonos / contactos

| # | Tema | Opciones |
|---|------|----------|
| C1 | **Ronald Interseguro** | (1) Solo IG @ronaldreyess (2) WA **984 503 022** (3) otro: ___ |
| C2 | **Harold** | (1) IG @HansEnimen (2) **991 081 023** (3) otro |
| C3 | **Grupo Gastronómico Magisterio** | (1) **920 076 710** confirmado (2) otro número del aviso |
| C4 | **Mountain Lodges** | Confirmado: se envió **Plin 937054328** por error → ¿mensaje de corrección ya enviado? (sí / no) |

### D. Estado comercial (vs CRM actual)

| # | Cliente | CRM / traspaso | Opciones |
|---|---------|----------------|----------|
| D1 | **Distribuidora ferretera** 984 666 551 | Traspaso: APROBÓ aviso 4 oct | (1) Etapa **negociación** + plan S/50 (2) Ya pagó (3) otro |
| D2 | **Industrias Lalo** | Traspaso: aviso combinado 5 puestos | (1) Propuesta S/50 (2) Solo Destacado S/30 (3) pausa |
| D3 | **Raquel** | Eligió S/15, audio mozo **y** steward | (1) Un aviso combinado (2) Dos avisos (3) pendiente definir |
| D4 | **Casa Carbajal** | Reporte + republicación prometidos | (1) ¿Ya contactaste dom 4–lun 5? (2) ¿Republicación hecha en producto? |
| D5 | **Servicios Varios** | ¿Publicado en Buscadis? | (1) Sí, id: ___ (2) No, pendiente (3) parcial |

### E. Producto / reportes

| # | Tema | Opciones |
|---|------|----------|
| E1 | Reporte 7 días (vistas, clics WA) | (1) Manual (capturas TikTok/redes) (2) Construir query Supabase/events (3) Mixto |
| E2 | **Pucara** aviso gratis | URL traspaso `AInRg3pBWg` — ¿sigue vigente 30 días? (sí / no / corregir id) |

### F. Fiscal (solo decisión tuya)

| # | Tema | Opciones |
|---|------|----------|
| F1 | ¿Contratas contador antes de más facturas? | (1) Sí, esta semana (2) No, seguir emitiendo yo (3) solo boletas S/15 |

## Errores documentados (no repetir)

- Marcar Black Llama pagado sin ver Interbank
- Plin personal a Mountain Lodges
- Volumen WA → restricción 3 oct
- “Página propia” sin aclarar perfil Buscadis
- Copiar requisitos discriminatorios de avisos Rueda

## Próximos pasos sugeridos (orden)

1. Respondes tabla **A–E** (aunque sea “1, 1, 1…”).
2. Actualizo `campana-rueda-oct-2026.json` + `import --apply`.
3. Añado al CRM los **20+20** de lista guardada ed. 2764 que faltan en JSON.
4. Guardas traspaso completo como `docs/comercial/TRASPASO-CAMPANA-FULL.md` (export Markdown desde Claude) si quieres versión literal 16 secciones.
5. Cuando pases un chat: `Cliente + WA + pegado` → nota en CRM + `wa.me` listo.

## Redes (cifras traspaso)

Facebook ~93, Instagram ~17, TikTok ~213; Casa Carbajal TikTok 597 vistas.
