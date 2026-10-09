# Insights campaña Rueda oct 2026 (vivo)

Actualizado: **9 oct 2026**. Estado completo del inbox: **`PIPELINE-ESTADO-2026-10-09.md`**. Fuente: chats + capturas WA + `wa-chats/`.

## Qué medir en cada contacto

| Campo | Uso |
|-------|-----|
| `etapa_label` | Pipeline en JSON → CRM |
| `ultimo_movimiento` | Último hecho verificable |
| `notas_extra` | Aprendizaje / patrón |
| Chats en `wa-chats/` | Historial para actividades (`import-whatsapp-exports-dir`) |

## Patrones que ya vimos

### Rueda ya leída → no preguntar puesto a ciegas (oct 2026)

- Si el PDF/Rueda lista roles, **citarlos** y pedir solo **horario, sueldo, dirección, WA de CV**.
- Cierre: **muestra publicada en buscadis.com** (link real) + diseño, no solo imagen suelta — ver `MUESTRA-EN-WEB.md`.
- Caso **empresa informática** (958317767 / jorgemen): 2 señoritas ventas + 3 practicantes pro.

### «¿Cuál es el más urgente?»

- Sirve para **abrir** cuando hay muchos puestos (Raquel terminó publicando **los dos** en un solo aviso).
- **No obligatorio:** si el cliente ya dijo que buscan, mejor **confirmar todos los puestos** y armar **un aviso** (o el plan mensual) en lugar de forzar uno solo.
- Evitar en el 2.º mensaje: párrafos largos + «no somos postulantes» si ya dijeron Buscadis y ven el perfil.

### Apertura «Buenas, vi el aviso de… ¿Siguen buscando?»

- **Funciona** cuando hay humano y necesidad real (Raquel, ferretera, Lalo).
- **Silencio o solo ✓✓** en muchos contactos del lote «chocolatería / hotel / turismo» (capturas 5 oct): sin respuesta humana.
- **Bots de hotel/turismo** (OLE ALE, Wild Rover, Laramani, REVANT): mensaje de bienvenida; el humano a veces no entiende o rechaza («Tonterías»).
- **Confusión empleador/postulante**: agencia 994137274 pidió **CV** — el copy suena a reclutador.

**Optimización propuesta**

1. Primera línea: gancho por **rol** («¿siguen buscando mozos?»). **No** «Rueda». «No soy postulante» solo si piden CV o en 2.º mensaje.
2. Segmentar: **no insistir por WA** en hoteles con bot; intentar llamada o correo del aviso Rueda.
3. Registrar en CRM `SIN HUMANO` vs `RESPONDIÓ` vs `PAUSA` para no recontactar en vano.

### Precio y cierre

- Preguntas típicas antes de pagar: **tarifa**, **redes**, **efectividad**.
- Respuesta honesta en efectividad + **S/15 de prueba** cerró con Raquel.
- **Yape Shantall** facilitó S/15; transferencia larga generó fricción («¿Dónde yapeo?» dos veces).
- **Anclaje S/50:** cevichería 958110360 — al cerrar solo se ofreció **plan Empresa S/50** (sin S/30/S/15 en el mensaje); aceptó flyer y plan sin pedir plan barato. Objeción **después** fue fanpage (94 vs 23 k), no precio → playbook `docs/comercial/OBJECION-POCOS-SEGUIDORES.md` → **S/50 pagado** 5 oct.

### Producto

- Raquel: publicado `z77hrQbMYJ` — validar reporte 7 días como prometido.
- Ferretera: aprobó texto; atasco en **diseño + RUC** — recordar pedir fiscal antes del cobro en multi-puesto.

## Contactos documentados en este lote

| Teléfono | Negocio | Estado 5 oct |
|----------|---------|----------------|
| 984646887 | Raquel / Magisterio | **PAGÓ / publicado** |
| 958110360 | Cevichería / Elicita | **PAGÓ S/50** · `Rp7msAf6Hl` · objeción seguidores resuelta |
| 976250507 | Pollería Nina | **RESPONDIÓ** 6 oct · mensajes cortos 10:02–10:05 · espera puestos |
| 984271525 | Tambobamba | **RESPONDIÓ** · pregunta oficina física (encuadre digital) |
| 984903140 | Tradiciones Apurímac / Oswaldo | **PIDIÓ PRECIO** |
| 966364330 | Quinta Poroy | Bot + buen día |
| 920124104 | Oly Pastelería / Ricardo | En datos |
| 984666551 | Ferretera | Aprobó copy; **cobro pendiente** |
| 970842362 | Lalo | Propuesta S/50 enviada; **sin respuesta** |
| 994137274 | Agencia viajes | **ALERTA** (pidió CV) |
| @bconcha23 | Saylla | Precio + canales; **like, sin cierre** |
| 983724785 | OLE ALE | **PAUSA** (no buscan) |
| 992230299 | REVANT | **PAUSA** (rechazo) |

## Próximo paso operativo

1. Pegar más chats en Cursor → se guardan en `wa-chats/` y se actualiza `campana-rueda-oct-2026.json`.
2. Sincronizar CRM: `npx tsx scripts/comercial/import-campana-rueda-oct-2026.ts --apply`
3. Actividades WA: `npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=data/comercial/wa-chats --apply`
