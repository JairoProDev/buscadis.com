# 09 — Analítica, conversión y panel del negocio

> **CONTEXTO PARA LA IA:** la instrumentación no es un extra: el informe mensual que el negocio recibe es la mitad de la razón por la que renueva. Implementa esta taxonomía exactamente como está.

---

## 1. Métrica norte

**Acciones de contacto por perfil por mes.** Un contacto es un handoff completado a WhatsApp, llamada, ruta, pedido o cita. Es lo único que el negocio siente en su caja.

Métricas de apoyo: tasa de acción (contactos / visitas), profundidad de scroll hasta catálogo, completitud media de perfiles, tasa de compartido, retención de suscripción al mes 3.

## 2. Taxonomía de eventos

Nombres en `snake_case`, español, verbo en pasado. Propiedades comunes en todos: `negocio_id`, `slug`, `arquetipo`, `plan`, `origen`, `dispositivo`, `sesion_id`.

```
# Ciclo de vida de la visita
perfil_visto                {origen: 'whatsapp'|'google'|'qr'|'mapa'|'deals'|'directo'|'ia', referrer}
seccion_vista               {modulo, tiempo_ms}
scroll_profundidad          {porcentaje: 25|50|75|100}
perfil_abandonado           {tiempo_total_ms, ultimo_modulo}

# Descubrimiento
producto_visto              {producto_id, posicion}      // impresión en carrusel
producto_abierto            {producto_id, origen: 'carrusel'|'catalogo'|'busqueda'}
catalogo_abierto            {total_productos}
categoria_filtrada          {categoria_id}
busqueda_interna            {termino, resultados}
galeria_abierta             {indice}
highlight_abierto           {highlight_id}
highlight_completado        {highlight_id, slides_vistas}
resenas_expandidas          {}
promocion_vista             {promocion_id}

# Conversión
accion_click                {tipo: 'whatsapp'|'llamada'|'ruta'|'cita'|'cotizar'|'web', origen_modulo, producto_id?}
handoff_redirigido          {canal, token, producto_id?}
compartido                  {canal: 'whatsapp'|'copiar'|'nativo'|'qr'}
seguido                     {}
favorito_agregado           {producto_id?}
ia_pregunta                 {pregunta, respondida: bool}
resena_enviada              {estrellas}

# Negocio (panel)
perfil_editado              {campo}
producto_creado             {metodo: 'manual'|'lote'|'foto'}
completitud_cambiada        {de, a}
qr_descargado               {pieza}
```

**Implementación:** cola en memoria, envío por lotes cada 5 s y con `visibilitychange` usando `navigator.sendBeacon`. Sin cookies de terceros. Sesión anónima con ID rotativo de 30 minutos. Cero impacto en el hilo principal.

## 3. Atribución del handoff

Todo enlace externo pasa por `/r/{token}`. El token codifica `{negocio_id, canal, modulo, producto_id, sesion_id, ts}` firmado. El redirect es 302 inmediato (< 30 ms) y el evento se escribe de forma asíncrona.

Esto permite el dato que vende el producto: *"Este mes te escribieron 47 personas. 31 después de ver un producto. El más consultado: Cemento Sol 42.5kg (12 consultas)."* Ninguna competencia local puede decirle eso a un negocio.

## 4. Panel del negocio — qué mostrar

El dueño no es analista. Cuatro bloques, en este orden:

**Lo que pasó esta semana.** Tres números grandes: visitas, contactos, producto más consultado. Comparados con la semana anterior con una flecha. Nada más arriba.

**Qué hacer ahora.** Una sola recomendación, generada por reglas, formulada como beneficio con evidencia: *"Tienes 14 preguntas sin responder sobre delivery. Agrégalo a tu perfil"* o *"Tus perfiles con 10+ productos reciben el doble de consultas. Te faltan 4"*.

**De dónde vinieron.** Barras simples: WhatsApp, Google, QR, mapa, Deals, directo. Sirve para que el negocio entienda que el sticker de la puerta funciona — y para que compre más stickers.

**Tus reseñas.** Nuevas sin responder arriba, con botón de respuesta en un toque y respuestas sugeridas por IA que el dueño puede editar.

**Informe mensual por WhatsApp.** El primer día de cada mes, un mensaje con una imagen generada: los tres números, el producto estrella y una recomendación. Es el recordatorio de valor justo antes del cobro. Es, medida por medida, la acción de retención más barata que existe.

## 5. Experimentos prioritarios

Ejecutar en este orden, con asignación por negocio (no por visitante, para no romper la consistencia de un perfil):

1. **Posición del catálogo** (posición 2 vs. posición 5) → impacto esperado en tasa de acción: alto.
2. **Ancho del card de producto** (156px vs. 120px) → valida la tesis de la densidad de `05 §6`.
3. **Mensaje pre-armado en WhatsApp** (con contexto vs. vacío) → impacto en respuestas del negocio.
4. **Estado vivo con tiempo de respuesta** (visible vs. oculto) → impacto en tasa de contacto.
5. **Promoción rotativa vs. única** → cierra la discusión con datos propios.
6. **Barra fija con 1 acción vs. 3 acciones** → valida el principio de acción única.

Regla: nada se declara ganador con menos de 2 semanas y 3,000 visitas por variante.

## 6. Privacidad

Sin identificación personal del visitante. Sin cookies de terceros. Sin píxeles de redes en el perfil público (rompen rendimiento y confianza). Aviso de privacidad accesible desde el pie. Los datos agregados que ve el negocio nunca permiten identificar a un visitante individual, y esto se le dice explícitamente en el panel: es un argumento de confianza, no una limitación.
