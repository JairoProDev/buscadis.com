# Perfil Vivo — P10 captura reseña post-contacto

**Date:** 2026-08-08  
**Source:** `06` §8 captura automática  
**Depends on:** P10 lite reviews

## Goal

Enlace de **una pregunta** (estrellas) que el negocio manda por WhatsApp ~después del contacto. Sin login. Marca “Contacto verificado”.

## Flow

1. Dueño copia enlace desde Confianza / API  
2. Cliente abre `/resena/{token}`  
3. Elige 1–5 estrellas (+ texto opcional + nombre)  
4. Insert `business_reviews` con `is_verified` / `verified_purchase`

## Out of scope

SMS/WA automático al cliente (falta número); respuesta del dueño en panel.

## Cron lite (hecho)

`GET /api/cron/review-invite-nudge` (diario 14:00 UTC): si hubo `whatsapp_click` hace 48–72h y no hay reseña nueva → notificación `system` al dueño con `inviteUrl`.
