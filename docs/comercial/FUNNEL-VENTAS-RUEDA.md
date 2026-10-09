# Embudo Rueda → cliente (sistema completo)

**Norte:** cada aviso de empleo en Rueda es un anunciante que **ya pagó** por visibilidad arcaica. Nosotros ofrecemos canal digital superior; el trabajo es **datos perfectos + conversación uno a uno + micro-síes** hasta pago y recurrencia.

**Documentos hermanos:** `PROTOCOLO.md` (ingesta) · `RUNBOOK-QA.md` (calidad) · `MUESTRA-EN-WEB.md` · `OFERTA-PLANES.md` · `campana-insights.md` · `PIPELINE-ESTADO-*.md`

---

## 1. Metas: qué es realista y qué es proceso

| Meta | Tipo | Definición |
|------|------|------------|
| **100% leads con ficha completa** | Proceso | Todo aviso empleo en CSV/CRM con teléfono, texto, página, gancho validado |
| **100% con mensaje 1 personalizado** | Proceso | Ningún copy masivo idéntico el mismo día; variante por `import_key` / rol |
| **100% respuesta al M1** | Aspiración | Imposible en frío; **subir % semana a semana** es la meta |
| **100% cierre** | Aspiración | No todos contratan hoy; sí **100% con siguiente paso claro** (sí / no / pausa / bot) |

**Benchmarks internos (empleo Cusco, oct 2026):**

| Etapa | Señal | Rango observado / objetivo |
|-------|--------|----------------------------|
| M1 enviado → leído | ✓✓ azul | 30–50% en lotes masivos; **>60%** con gancho rol + 1 burbuja |
| M1 → respuesta humana | Texto | **~5–15%** lote sábado; **~30–50%** cuando confirman vacante en 2 turnos |
| Muestra → pago | Yape | Raquel, cevichería, Mapacho: **honestidad + muestra + S/15 o S/50** |
| Bot / no humano | Menú A/B/C | **Archivar**; no cuenta como “no respondió” |

---

## 2. Capa 0 — Datos (página por página contigo + Cursor)

**Objetivo:** antes de escribir a nadie, el lead en repo = lo que dice el papel.

### Flujo por edición

1. PDF en `archive/editions` + `extract-edition` → `output/rueda/R####/avisos.json`.
2. **Tú pasas página a página** (foto, captura o “página N de R2767”) en Cursor.
3. Agente contrasta con `avisos.json` + `revision.csv` para esa `pagina`:
   - ¿Faltan avisos? ¿Se fusionaron dos? ¿Teléfono mal?
   - ¿Título vs descripción (gancho)? → `resumenGanchoVacante`.
4. Corrección: patch en `revision.csv` o fix en `extraer-anuncios-rueda.ts` si es patrón repetido.
5. `npm run rueda:leads-empleos` + `rueda:sync-sheets` + backfill CRM.
6. Marcar fila: `qa_pagina_ok: true` en notas oportunidad.

### Checklist QA por página

- [ ] Número de bloques en PDF = filas con esa `pagina` en JSON
- [ ] Cada empleo: ≥1 WhatsApp/teléfono 9 dígitos PE
- [ ] Texto completo (puestos, sueldo, zona, beneficios)
- [ ] Categoría = empleos / no confundir con clasificado mezclado
- [ ] `import_key` único estable
- [ ] Gancho WA probado (no contradice descripción)
- [ ] Oportunidad CRM creada o vinculada

### Prioridad de contacto (mismo orden siempre)

1. Recurrentes en varias ediciones  
2. Multi-puesto / empresa grande  
3. Sueldo visible o “urgente”  
4. Teléfono único (no solo fijo)  
5. Resto empleo Cusco  
6. Bots hoteles → email/tel fijo o pausa  

---

## 3. Embudo conversacional (medido)

Cada lead lleva en JSON/CRM:

```text
m1_enviado_at, m1_leido, m1_respuesta, m2_enviado_at, m2_respuesta, …
etapa_label, ultimo_movimiento, resultado (ganado|perdido|pausa|bot)
micro: { guardo_contacto, vio_muestra, aprobo_texto, pago, reclamo_cuenta, … }
```

### Etapas y KPI

| # | Etapa | Éxito | Qué medir |
|---|--------|-------|-----------|
| 0 | QA datos | Ficha OK | `qa_pagina_ok` |
| 1 | M1 enviado | 1 burbuja personalizada | `whatsapp_outbound` |
| 2 | M1 respuesta | Cualquier texto humano | `whatsapp_inbound` |
| 3 | Calificado | “Sí buscamos” + rol confirmado | nota + etapa `interesado` |
| 4 | Datos vacante | horario/sueldo/WA CV | campos en notas |
| 5 | Muestra web | link `buscadis.com/a/…` enviado | `adiso_id` muestra |
| 6 | Aprobación | “está bien” / cambios hechos | actividad |
| 7 | Propuesta $ | S/50 → S/30 si objeción | `plan_tier` |
| 8 | Pago | Yape + comprobante | `ganado` |
| 9 | Activación pagada | redes + grupos + reporte | script `activate-paid-*` |
| 10 | Cuenta | reclamo + perfil negocio | producto |
| 11 | Recurrencia | 2ª edición / renovación | `sales_account` |
| 12 | Advocacy | referido / reseña / compartió | manual |

---

## 4. Mensaje a mensaje — qué funcionó / qué no

### Mensaje 1 (apertura)

| ✅ Funciona | ❌ No funciona |
|------------|----------------|
| Pregunta corta por **rol concreto** (mozo, ayudante cocina, barman) | “Soy Jairo de Buscadis” en línea 1 |
| Una sola burbuja | 3–6 burbujas seguidas |
| Variante A/B por seed (`mensajeWaEmpleoCusco`) | Mismo texto a 20 números el mismo día |
| “¿Sigue abierta la vacante?” | “En Rueda de Negocios” (confunde / spam) |
| Título **+** descripción para el gancho | Solo título (“mozas” cuando es artesanal) |

**Plantilla mental M1:**  
`[Gancho rol]. [Una pregunta sí/no].`  
Identidad Buscadis **solo si responden** o en M2.

### Mensaje 2 (si respondieron)

| ✅ Funciona | ❌ No funciona |
|------------|----------------|
| Citar puestos del aviso; pedir solo huecos (horario, sueldo, WA) | “¿Qué puesto busca?” sin contexto |
| “Le armo borrador y se lo muestro **antes** de publicar” | Precio antes de confirmar que siguen buscando |
| Aclarar **no postulante** solo si piden CV | Párrafo largo de canales sin pedir un dato |
| Un CTA: “¿Solo este número o también el X?” | Interrogatorio de 5 preguntas (Limbush) |

### Mensaje 3+ (muestra y cierre)

| ✅ Funciona | ❌ No funciona |
|------------|----------------|
| **Link real** en buscadis.com + “revise texto y celulares” | Solo JPG sin URL |
| S/50 ancla multi-puesto / mes; S/15 prueba honesta (Raquel) | Ofrecer solo barato sin ancla |
| Yape Shantall en un mensaje | “¿Dónde yapeo?” repetido |
| Honestidad en efectividad | Prometer “garantizado llenan” |
| Objeción seguidores → playbook dedicado | Ignorar miedo a redes |

### Seguimiento sin respuesta

| ✅ Funciona | ❌ No funciona |
|------------|----------------|
| 1 toque nuevo con **otro gancho** a las 48–72 h | “Ayer le escribí por Rueda…” |
| Audio 15–20 s (provincia) | 4 mensajes el mismo día |
| Pausa 14 días tras 2 intentos | Insistir en bots hoteles |

---

## 5. Checklist maestro de microconversiones

No hace falta lograr todo en la primera venta; **anota cada sí** en `notas_extra` o CRM.

### Confianza y contacto

- [ ] Respondió primer mensaje  
- [ ] Respondió segundo mensaje  
- [ ] Confirmó que la vacante sigue abierta  
- [ ] Identificó decisor (dueño / RRHH / encargado)  
- [ ] **Guardó tu número** (pedir explícito: “Guárdeme como Buscadis Empleos”)  
- [ ] Te agregó a contactos con nombre claro  
- [ ] Aceptó recibir borrador por este WA  
- [ ] Envió logo o fotos del local  
- [ ] Compartió RUC antes del cobro (multi-puesto)  

### Producto y web

- [ ] Abrió link de muestra (`buscadis.com/a/…`)  
- [ ] Aprobó texto del aviso  
- [ ] Eligió diseño / flyer  
- [ ] Visitó home buscadis.com  
- [ ] Visitó sección empleos Cusco  
- [ ] **Reclamó cuenta** de anunciante (magic link / OTP)  
- [ ] Creó **perfil de negocio** (`mi-negocio`)  
- [ ] Descargó app (Android / iOS)  
- [ ] Activó alertas de empleo (postulante side — opcional para ellos como empleadores: notificaciones de postulantes si existe)  

### Redes y difusión

- [ ] Siguió @buscadis (IG/FB/TikTok — los que uses)  
- [ ] Se unió a grupo WA “Ofertas Cusco” (si aplica)  
- [ ] **Compartió** la publicación de su vacante en su red  
- [ ] Permite etiquetar su negocio en historia Buscadis  
- [ ] Autoriza usar su logo en caso de éxito  
- [ ] Dejó reseña / testimonio escrito  
- [ ] Grabó audio/video testimonio corto  
- [ ] **Referido**: dio teléfono de otro negocio que también publica en Rueda  
- [ ] Acepta aparecer en “caso de éxito” en web  

### Comercial

- [ ] Entendió diferencia vs diario físico (Julio Tambobamba)  
- [ ] Pidió precio (señal de compra)  
- [ ] Comparó S/50 vs S/30 conscientemente  
- [ ] Pagó (Yape / transferencia)  
- [ ] Recibió boleta/factura  
- [ ] Recibió reporte de 7 días (prometido)  
- [ ] Renovó o amplió plan al mes siguiente  
- [ ] Publicó 2ª vacante sin re-vender desde cero  

### Anti-objetivos (marcar y no insistir)

- [ ] Bot sin humano → `BOT`  
- [ ] “Puesto ya cubierto” → `perdido`  
- [ ] Rechazo explícito → `perdido` + motivo  
- [ ] Solo quería CV tuyo → mal segmento  

---

## 6. Gratis en webapp — reciprocidad sin sonar desesperados

**Principio:** la muestra gratis no es “regalo sin más”; es **inversión ya hecha** que ellos pueden aprovechar si confirman un paso pequeño.

### Secuencia recomendada

1. **Muestra gratis** en web (destacado temporal o plan muestra S/50 pending) — ya haces esto.  
2. Pedir **a cambio** (elige 1–2, no los 12):  
   - “Si le sirve el borrador, ¿me confirma horario y sueldo para dejarlo perfecto?”  
   - “¿Me guarda como contacto para enviarle el reporte de postulantes?”  
   - “Cuando publiquemos en redes, ¿me autoriza mencionar [Nombre del Chifa]?”  
3. **FOMO suave (verdad):**  
   - “Esta semana priorizamos vacantes con muestra aprobada para historias de empleos Cusco.”  
   - “El destacado del mes tiene cupo limitado de republicaciones en grupos.”  
4. **No** publicar en redes pagadas hasta pago (ya ops) — el cliente siente que falta “activar” algo que ya vio.

### Invertir la balanza (ellos más interesados)

No es magia; es **escasez + prueba + estatus**:

| Tú haces | Ellos sienten |
|----------|----------------|
| Muestra profesional ya hecha | “Ya trabajaron por mí” |
| “Solo activamos redes cuando usted aprueba” | Control + deuda social leve |
| Casos pagados (sin mentir métricas) | Prueba social |
| “Si no les sirve, el aviso básico en web puede quedar; lo pagado es difusión” | Ancla clara |
| Responder lento a precio hasta que aprueben texto | Tú no persigues; ellos piden activación |
| Pedir que **compartan** su link Buscadis | Ellos venden su vacante; tú eres infraestructura |

**Evitar:** perseguir con 5 mensajes; regalar redes sin límite; bajar precio sin objeción.

---

## 7. Cadencia operativa semanal

| Día | Foco |
|-----|------|
| Lun | QA 1 edición (páginas contigo) + M1 a 5–8 leads 🔴 |
| Mar–Jue | Seguimiento M2/M3 + muestras + cierres |
| Vie | Métricas: M1→R1%, muestras, pagos, microconversiones |
| Sáb | Solo si energía: 10 M1 **personalizados** (no 40 iguales) |

**Límite saludable:** máx. **25 M1/día** solo si cada uno es distinto y hay capacidad de seguimiento 🔴.

---

## 8. Plantilla de registro por lead (pegar en `campana-rueda-oct-2026.json`)

```json
"funnel": {
  "qa_ok": true,
  "m1": "2026-10-09",
  "m1_reply": null,
  "m2": null,
  "muestra_url": null,
  "micro": {
    "guardo_contacto": false,
    "vio_link": false,
    "aprobo_texto": false,
    "pago": false,
    "reclamo_cuenta": false,
    "compartio_redes": false,
    "referido": false
  }
}
```

---

## 9. Cómo seguimos contigo + Cursor

1. **Envías:** “R2767 página 12” (+ imagen si hay duda).  
2. **Yo:** diff JSON ↔ página, fixes, gancho WA, fila CRM.  
3. **Tú:** envías M1 (copiar de Sheets o sugerido); pegas hilo cuando responda.  
4. **Yo:** M2/M3, script muestra si toca, actualizo pipeline + insights.  

Cuando exista webhook WA, `m1_reply` se autocompleta; hasta entonces: `wa-chats/` + import.

---

## 10. Frases listas (micro-síes)

**Guardar contacto:**  
«Don/Doña [X], guárdeme como **Buscadis Empleos** para mandarle el reporte cuando empiecen a escribirle postulantes.»

**Compartir publicación:**  
«Cuando activemos su plan, le paso el link para que lo comparta en su WhatsApp de clientes; suele llegar gente de la zona.»

**Reclamar cuenta:**  
«Su aviso ya está en buscadis.com; si reclama la cuenta con su celular, después usted mismo puede editar sueldo o sumar puestos.»

**Referido:**  
«¿Conoce otro restaurante o hotel que también esté buscando personal esta semana? Con gusto les armamos el mismo tipo de aviso.»

---

*Última actualización: 9 oct 2026. Revisar tras cada edición Rueda nueva.*
