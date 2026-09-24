---
description: Implementación de 20 Mejoras para el Editor de Negocio
---

# Plan de Implementación de 20 Mejoras

Este plan detalla la implementación de las 20 funcionalidades solicitadas para el Editor de Negocio.

## 1. Crecimiento y Conversión (Prioridad Alta)

- [x] **Generador de Descripción con IA**: (Simulado) Añadido botón "Mejorar con IA" junto al campo de descripción.
- [ ] **Botón Flotante WhatsApp**: Añadir opción de configuración para mensaje predefinido. (Visualmente ya existe en preview).
- [ ] **Generador de QR**: Añadir botón en header para descargar QR del slug actual.
- [ ] **Links a Redes Sociales**: Añadir sección de "Redes Sociales" en el editor (Instagram, TikTok, FB) con inputs.
- [ ] **Barra de Anuncios (Sticky Bar)**: Añadir campo "Adiso Global" en el editor y renderizarlo en `BusinessPublicView`.

## 2. Personalización y Diseño

- [x] **Paletas de Colores Inteligentes**: Implementado selector de círculos con presets de colores populares.
- [ ] **Selector de Plantillas de Grid**: Añadir opción "Visualización" (Grid/Lista) en perfil y usarla en `BusinessPublicView`.
- [ ] **Galería de Fotos**: Añadir sección para gestión de array `gallery_images`.
- [ ] **Subida de Favicon**: Añadir input file para `favicon_url`.
- [ ] **Fuentes Tipográficas**: Añadir selector de fuentes (Inter, Serif, Mono).

## 3. Datos y Utilidad

- [ ] **Contador de Visitas**: Mostrar `view_count` en el header del editor.
- [ ] **Mapa Interactivo**: Integrar mapa real (Leaflet/Google) en editor para seleccionar coords.
- [ ] **Horarios de Atención**: Añadir matriz de horarios (L-D, Open/Close) en editor.
- [ ] **Insignias de Verificación**: Añadir estado visual de verificación si `is_verified` es true (backend control).
- [ ] **Sección de Reseñas**: Añadir array `reviews` al perfil y editor manual.

## 4. Funcionalidades Avanzadas

- [ ] **Dominio Personalizado**: Añadir campo `custom_domain` (solo visual UI por ahora).
- [ ] **Pixel Facebook/TikTok**: Añadir campos de configuración de tracking ID.
- [ ] **Modo Vacaciones**: Toggle "Modo Vacaciones" que oculta botones de compra/contacto.
- [ ] **Formulario de Contacto Directo**: Toggle para mostrar form de email en `BusinessPublicView`.
- [ ] **SEO Preview**: Componente visual en el editor que muestre cómo se ve el link en Google/FB.

## Pasos Siguientes Inmediatos

1. Implementar Inputs de Redes Sociales.
2. Implementar Generador de código QR (usando librería o API).
3. Añadir Sticky Bar.
