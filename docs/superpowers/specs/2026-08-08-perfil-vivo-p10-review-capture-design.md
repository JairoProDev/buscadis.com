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

Cron 48h automático (necesita cola + número del cliente); respuesta del dueño en panel.
