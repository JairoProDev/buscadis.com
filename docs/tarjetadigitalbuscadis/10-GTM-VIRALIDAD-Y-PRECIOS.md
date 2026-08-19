# 10 — Go to market, viralidad y precios

> **CONTEXTO PARA LA IA:** este documento no es para código. Es para producto, ventas y contenido. Algunas mecánicas de crecimiento (imagen OG, QR con origen, invitación por reseña) sí exigen implementación y están marcadas.

---

## 1. El problema real del lanzamiento

El Perfil Vivo tiene un problema de arranque en frío doble: sin negocios no hay usuarios, y sin usuarios los negocios no ven razón para pagar. Casi todos los marketplaces mueren ahí.

**La salida es no depender del tráfico de Buscadis al principio.** El perfil tiene que ser valioso el día 1 aunque nadie lo descubra dentro de la plataforma, porque el negocio lo va a distribuir él mismo: lo pone en la bio de Instagram, lo manda por WhatsApp, lo pega en la puerta. El tráfico inicial de cada perfil es tráfico que trae el propio negocio. Nosotros lo convertimos mejor que su alternativa y le damos datos.

Eso invierte el orden habitual: **primero vendemos una herramienta, después construimos la red.** El marketplace se llena como consecuencia de los perfiles, no al revés.

---

## 2. Los cinco bucles de crecimiento

**Bucle 1 — Distribución del propio negocio.** El negocio comparte su enlace. Cada visitante ve un perfil de Buscadis. Una fracción entra a explorar la plataforma. *Requiere: imagen OG dinámica, pie de marca discreto pero presente, y velocidad — un perfil lento no se comparte.*

**Bucle 2 — QR físico.** Sticker en la puerta, en el mostrador, en la bolsa, en el casco del rider. Cusco tiene una densidad comercial peatonal enorme y turistas que escanean todo. *Requiere: generador de piezas con parámetro de origen.* Costo por sticker: céntimos. Es tu canal más barato y el que ninguna plataforma remota puede replicar.

**Bucle 3 — Reseña como invitación.** Al cliente que dejó reseña se le muestra un enlace a Buscadis con "descubre más negocios cerca". Cada reseña es un usuario nuevo potencial. *Requiere: flujo de reseña post-contacto.*

**Bucle 4 — Comparación entre negocios.** Cuando un negocio ve el perfil de su competencia con verificación y 40 reseñas, quiere el suyo. Este bucle es el más fuerte en mercados densos y es la razón para atacar **por rubro y por calle**, no por ciudad completa: llena una galería comercial entera y el resto se contagia.

**Bucle 5 — Deals.** El contenido del perfil se promueve al feed, el feed trae usuarios que no eran del negocio, el negocio ve tráfico que no trajo él. Este es el bucle que justifica el precio a largo plazo y el que convierte una herramienta en una red.

---

## 3. Precios

Narrativa **centro comercial digital**: Free = pasillo/muestra; Pro = alquiler de vitrina (S/30); Max = local ancla + personal digital (S/300). Norte = transacciones (pedidos/citas/cotizaciones), no vanity.

| Plan | Precio | Incluye |
|---|---|---|
| **Free** | S/0 | Muestra: hasta 10 productos (tope duro), indexable, lead WA básico, métricas básicas |
| **Pro** | **S/30/mes** o S/300/año | Vitrina: catálogo ilimitado, pedidos estructurados, novedades/promos, prioridad search/mapa, Deals, verif. 2 |
| **Max** | **S/300/mes** | Local ancla: ADIS AI del negocio, checkout en línea, contenido/pauta, verif. 3, acompañamiento |

Spec: `docs/superpowers/specs/2026-08-08-buscadis-commerce-os-design.md`.

**Por qué el plan free debe tener perfil real y no una versión mutilada.** Un perfil free feo no se comparte, y si no se comparte no genera el bucle 1, que es el motor entero. El free debe ser bueno y sentirse limitado por *volumen* (10 productos) y por *alcance* (no aparece destacado, no publica en Deals), no por dignidad. Un negocio que se avergüenza de su perfil gratis no se convierte a Pro: se va.

**Anual con descuento desde el día 1.** S/300 al año contra S/360 mensual. Reduce la cancelación en el mes 2, que es donde se pierden todos los SaaS de pyme.

**Ancla de precio en la venta:** un programador local cobra ~S/3,000 por una web más hosting. El plan anual cuesta el 10% de eso, incluye actualizaciones desde el celular, se encuentra en Google y le dice cuántas personas lo contactaron. Ese es el contraste que hay que decir en voz alta en cada visita.

---

## 4. Secuencia de lanzamiento (90 días)

**Días 1–30 — Diez perfiles perfectos.** Elige diez negocios de rubros distintos en Cusco, entre ellos los que ya tienes en camino (la distribuidora ferretera, el alojamiento en Urubamba, el negocio de vidrios y drywall). Constrúyeles el perfil tú, con fotos hechas por ti, catálogo cargado, verificación nivel 3 con visita. Gratis o al costo. **No son clientes: son el catálogo de muestra.** Sin ellos, ninguna demo convence.

**Días 31–60 — Densidad por rubro.** Elige un rubro y una zona (por ejemplo, ferreterías del Cusco o el corredor comercial de Av. El Sol). Ofrece perfil gratuito con carga de catálogo hecha por ustedes a cambio de reseña y permiso de usar el caso. La densidad es lo que activa el bucle 4.

**Días 61–90 — Cobro y evidencia.** A los primeros diez se les entrega el informe de 30 días con números reales. Ese informe es el material de venta: *"este perfil recibió 340 visitas y 47 contactos en un mes"*. Con eso, S/30 deja de ser un gasto y pasa a ser una compra obvia.

---

## 5. Guion de venta (5 minutos, en el mostrador)

1. **Pregunta, no presentes.** "¿Cómo te contactan hoy tus clientes nuevos?" Casi siempre: WhatsApp, Facebook, boca a boca. Deja que lo diga.
2. **Muestra su propio perfil ya armado.** Ten cargado un borrador con su nombre, su logo tomado de su fachada y tres productos. La velocidad de la demo es el argumento: en el teléfono de él, en su red, cargando en menos de dos segundos.
3. **Enséñale la línea de estado.** "Aquí tu cliente ve que estás atendiendo ahora y que respondes rápido." Es el momento que cierra ventas.
4. **Enséñale el panel.** "Y esto te dice cuántas personas te escribieron y qué producto miraron más."
5. **Compara con su alternativa.** Su Instagram no tiene precios. Su web (si tiene) nadie la actualiza. Google no muestra su catálogo.
6. **Cierra con el QR físico.** Imprime el sticker en el momento y pégalo en su mostrador. La entrega física de un objeto cierra la venta y activa el bucle 2 el mismo día.

**Objeciones frecuentes y respuesta:**
- *"No quiero publicar precios, mi competencia los ve."* → Tu competencia ya los sabe; tu cliente no. El que no publica precio pierde la consulta.
- *"Ya tengo Facebook."* → Perfecto, ponlo en tu perfil. Pero en Facebook no te encuentran cuando buscan "ferretería cerca".
- *"Es mucha plata al mes."* → Es S/1 al día. ¿Cuánto vale una venta tuya?
- *"No sé usar eso."* → Yo te lo dejo listo hoy. Lo único que tú harás es tomar fotos.

---

## 6. Contenido y viralidad (canal JairoProDev + Shantall)

Tres formatos con potencial real de alcance:

**"Le hice el perfil a un negocio de Cusco en 10 minutos".** Formato transformación antes/después con negocios reales. Es el contenido de mayor rendimiento para este producto porque el resultado es visual e inmediato, sirve como prueba social y como prospección (los negocios escriben pidiendo el suyo).

**"Tu negocio se ve así en internet" (auditoría rápida).** Buscas un negocio conocido en Google, muestras lo que aparece (nada, o información equivocada) y muestras cómo se vería con perfil. Doloroso, útil y compartible.

**Deals en vivo desde el local.** Encaja con la estrategia de caza-ofertas ya definida y convierte a los perfiles en el inventario del feed.

**Métrica de contenido:** no vistas. Perfiles creados atribuidos al contenido.

---

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Perfiles abandonados que envejecen y se ven mal | Detección de inactividad, alerta al negocio, y degradación automática de módulos vacíos |
| Negocios que suben fotos malas | Postprocesado automático + servicio de fotografía como upsell de S/50 |
| Copia rápida del diseño por un competidor | El foso es la red, la data local y la verificación presencial; acelerar densidad por zona |
| Reseñas falsas | Verificación por contacto real en la plataforma; reseña sin contacto verificado se marca distinto |
| Cancelación en el mes 2 | Informe mensual por WhatsApp + plan anual + tarea semanal de mejora del perfil |
| Que el negocio no cargue su catálogo | Carga asistida en la venta; importación desde CSV/Excel; carga por fotos múltiples con IA que sugiere nombre y precio |

El último riesgo es el más grave de todos: **el producto muere si el catálogo queda vacío.** Toda inversión en reducir el costo de cargar productos rinde más que cualquier función nueva.
