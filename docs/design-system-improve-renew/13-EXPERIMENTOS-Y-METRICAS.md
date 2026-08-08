# 13 — Métricas y experimentos

---

## 1. Qué mide un sistema de diseño

Dos familias. La primera dice si el sistema está sano; la segunda dice si el producto mejoró. Sin la segunda, un sistema de diseño es un proyecto de arte interno.

### Salud del sistema

| Métrica | Cómo se mide | Meta |
|---|---|---|
| Cobertura de tokens | % de declaraciones de color/espacio que usan `var(--bs-*)` | > 95% |
| Adopción de primitivas | % de botones/campos/modales que vienen del kit | > 90% |
| Deuda de duplicación | componentes que resuelven lo mismo | tendencia a 0 |
| Violaciones de accesibilidad | axe en Storybook y en rutas clave | 0 serias o críticas |
| Tiempo de construcción de una pantalla nueva | cronometrado en 3 pantallas comparables | −50% respecto a hoy |

La última es la que realmente importa: **el sistema existe para que construir sea más barato.** Si después de la migración una pantalla nueva no cuesta la mitad, el sistema no está funcionando.

### Impacto en producto

| Métrica | Por qué importa |
|---|---|
| Tasa de apertura de aviso desde la rejilla | mide la calidad de `AdisoCard` |
| Tasa de contacto por sesión (WhatsApp, llamada, chat) | métrica norte del marketplace |
| Publicaciones completadas / iniciadas | mide la fricción del composer |
| Perfiles publicados / iniciados | mide la experiencia del creador |
| Tiempo hasta primer resultado útil | velocidad percibida |
| LCP e INP en campo (CrUX) | velocidad real en dispositivos reales |
| Avisos indexados en Google | consecuencia directa del renderizado en servidor |

---

## 2. Experimentos priorizados

Ordenados por valor esperado sobre esfuerzo. Regla común: nada se declara ganador con menos de dos semanas y 3.000 sesiones por variante, y la asignación es por usuario, no por sesión.

**E1 · Color del CTA principal (accesibilidad + conversión).**
Hipótesis: el botón con `adis-600` y texto blanco convierte igual o mejor que el `#53acc5` actual, y es legible con sol. Riesgo de que el cambio "se sienta menos de marca" — se mide con una pregunta de reconocimiento, no con opinión propia.
*Métrica:* clics en la acción primaria por sesión.

**E2 · Densidad de la rejilla de avisos.**
Dos columnas con tarjeta de 162px contra tres columnas con tarjeta de 106px, en móvil. Valida la restricción de ancho mínimo de `08 §1`.
*Métrica:* aperturas de aviso por sesión y profundidad de scroll.

**E3 · Colores de categoría.**
Set completo re-afinado contra el cambio mínimo. Se acompaña de una prueba de árbol con 15 personas para validar que la taxonomía coincide con el modelo mental local antes de imprimir material físico.
*Métrica:* clics en categoría y tasa de acierto en la prueba de árbol.

**E4 · Altura del chrome.**
Header 56 + nav 56 contra el 72 + 64 actual.
*Métrica:* avisos vistos por sesión y tasa de contacto.

**E5 · Mensaje pre-armado en el handoff a WhatsApp.**
Con contexto de aviso contra chat vacío.
*Métrica:* respuestas del vendedor dentro de la primera hora — la métrica que le importa al que paga.

**E6 · Composer: texto libre primero contra formulario estructurado.**
Valida el principio de fricción progresiva de `09 §5`.
*Métrica:* publicaciones completadas / iniciadas.

**E7 · Etiquetas en la navegación inferior.**
Con texto contra solo íconos.
*Métrica:* uso de cada destino.

**E8 · Nav inferior fija contra ocultarse al hacer scroll.**
*Métrica:* navegación entre secciones por sesión.

---

## 3. Investigación cualitativa que va primero

Tres estudios que cuestan horas, no dinero, y que deben correr **antes** de los experimentos porque pueden invalidar la hipótesis:

**Prueba de cinco segundos de la tarjeta** con 10 personas: qué recuerdan. Si no recuerdan el precio, no hay experimento de densidad que salve la tarjeta.
**Prueba del tendero** con 5 dueños de negocio creando un perfil sin ayuda, con la pantalla grabada. Es la fuente de verdad sobre la experiencia del creador.
**Prueba de contraste en campo:** el teléfono en la puerta de un local al mediodía. Va a cambiar decisiones que ninguna herramienta de contraste puede anticipar.

---

## 4. Instrumentación mínima

Eventos con nombre en `snake_case`, verbo en pasado, y propiedades comunes (`sesion_id`, `dispositivo`, `origen`, `modo`, `densidad`).

```
aviso_impreso        {aviso_id, posicion, vista}
aviso_abierto        {aviso_id, origen}
contacto_click       {canal, aviso_id, origen_modulo}
handoff_redirigido   {canal, token}
filtro_aplicado      {tipo, valor, resultados}
busqueda_realizada   {termino, resultados, categoria}
publicacion_iniciada / publicacion_completada / publicacion_abandonada {paso}
perfil_publicado     {tiempo_total_s, productos}
tema_cambiado        {de, a}
```

Envío por lotes con `sendBeacon`, sin cookies de terceros, sin píxeles en la ruta crítica.

**Regla:** un componente del sistema no está terminado hasta que emite sus eventos. La instrumentación no es una fase posterior; es parte del contrato del componente.
