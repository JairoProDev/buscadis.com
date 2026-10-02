# Restaurante Mapacho — caso comercial y técnico

## Resumen

| Campo | Valor |
|-------|--------|
| **Nombre comercial** | Restaurante Mapacho |
| **Contacto / postulaciones** | WhatsApp **984 759 634** (`+51 984 759 634`) |
| **Origen** | Rueda de Negocios (prospección WhatsApp, 30 sep 2026) |
| **Plan** | Mensual S/ **50** — avisos ilimitados en Web/App, difusión en redes, página propia |
| **Vigencia** | **1 oct 2026** → **31 oct 2026** |
| **Pago** | Yape S/50 — op. `04018571` — 1 oct 2026, 13:40 (Lima) |
| **Alcance declarado** | Foco **Cusco y alrededores** (vivienda + alimentación en aviso) |

## Vacantes (8 plazas)

1. 01 Maestro panadero – pastelero  
2. 01 Ayudante de pastelería  
3. 02 Ayudantes de cocina *(añadido 30 sep por el cliente)*  
4. 02 Vajilleros  
5. 02 Mozas con **inglés avanzado**

**Requisitos:** experiencia en el puesto, disponibilidad inmediata.  
**Beneficios:** alimentación, vivienda, sueldo + propinas.  
**CTA:** enviar CV / contactar por WhatsApp al **984 759 634**.

## Entregables en Buscadis

- Aviso principal con flyer diseñado (`media/flyer-8-vacantes.jpg`).
- Avisos por puesto (búsqueda, filtros Empleos → Gastronomía / Atención / Limpieza según rol).
- Referencia al aviso impreso en Rueda (`media/rueda-negocios-original.png`).
- Historias vinculadas a cada aviso con promoción **premium** durante la vigencia del plan.
- Perfil de negocio: slug `restaurante-mapacho` (página propia del plan).

## Notas operativas

- No se registró dirección física exacta del local; ubicación en plataforma: **Cusco, Cusco** (mapa y filtros por zona).
- Cuenta anunciante: correo reservado `mapacho984759634@anunciantes.buscadis.com` (reclamar con magic link cuando el cliente entregue email propio).
- Republicaciones en redes: 2–3 durante el mes (fuera de este script; evidencias por WhatsApp).

## Publicación técnica

```bash
npx tsx scripts/clientes/publish-restaurante-mapacho.ts
npx tsx scripts/clientes/publish-restaurante-mapacho.ts --dry-run
```

Batch ID en `private_data`: `cliente-restaurante-mapacho-2026-10`.

## Publicado en producción (2 oct 2026)

| Rol | ID | URL |
|-----|-----|-----|
| Principal (flyer 8 vacantes) | `Wf75ziYwCp` | https://buscadis.com/a/Wf75ziYwCp |
| Maestro panadero–pastelero | `f0Z787z-uA` | https://buscadis.com/a/f0Z787z-uA |
| Ayudante pastelería | `JzO3A1YpfK` | https://buscadis.com/a/JzO3A1YpfK |
| Ayudante cocina (×2) | `FgUwBcAi93` | https://buscadis.com/a/FgUwBcAi93 |
| Vajillero (×2) | `oXb9cpQq3J` | https://buscadis.com/a/oXb9cpQq3J |
| Moza inglés (×2) | `G6X7zFU838` | https://buscadis.com/a/G6X7zFU838 |
| Referencia Rueda | `Brdhr5dX8N` | https://buscadis.com/a/Brdhr5dX8N |

- **Perfil negocio:** https://buscadis.com/@restaurante-mapacho  
- **User ID:** `bdb8904e-a4ce-4e5b-b8fd-20ebcdb4f9f8`  
- **1 historia** en carril (flyer principal); las demás se archivaron para no repetir 7 slides idénticos.  
- El aviso “Rueda (referencia)” se mantiene en el feed a propósito (contraste B/N vs flyer); la captura de revista solo vive en `media/` como contexto interno.  
- Cuenta: `mapacho984759634@anunciantes.buscadis.com` (contraseña temporal solo en registro interno / 1Password).

## Cronología (WhatsApp)

Ver transcripción completa en el brief del equipo (30 sep – 1 oct 2026): prospección Rueda → flyer borrador → ajuste 8 vacantes → cierre S/50 → pago Yape → solicitud de evidencias.
