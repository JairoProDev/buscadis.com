# 04 — Color y marca

---

## 1. La marca, congelada

| Rol | Valor | Dónde vive |
|---|---|---|
| Celeste de identidad | `#53ACC5` (`adis-400`) | logo, acentos decorativos, mesh |
| Amarillo de identidad | `#FFC24A` (`sol-400`) | CTA Publicar, acento de energía |
| Celeste de acción | `#2A7C94` (`adis-600`) | botones, enlaces, foco |
| Tinta sobre cálido | `#10242B` | texto sobre amarillo |

Quedan derogados: `#38bdf8`, `#fbbf24`, `#3b82f6` (`electric-500`), `#ec4899` (fallback rosa), `rgba(56,189,248,…)` del skip-link. Se actualizan `manifest.json`, `site.webmanifest`, OG, specs y el skip-link.

### Por qué identidad ≠ acción

| Par | Contraste estimado | Veredicto |
|---|---|---|
| Blanco sobre `#53ACC5` | ~2.3:1 | ✗ falla AA (4.5) y falla incluso UI (3.0) |
| Blanco sobre `#2A7C94` | ~4.6:1 | ✓ AA |
| `#53ACC5` sobre `#FFC24A` (CTA actual) | ~1.5:1 | ✗ falla gravemente |
| `#10242B` sobre `#FFC24A` (CTA nuevo) | ~11:1 | ✓ AAA |

*(Estimados con la fórmula WCAG 2.x; el pipeline los recalcula y CI los verifica en cada build.)*

El usuario sigue viendo "el celeste de Buscadis": la identidad la fija el logo y el conjunto, no el tono exacto del relleno de un botón. Spotify, Stripe y Mercado Libre hacen exactamente esto.

### Reparto de color en pantalla

Objetivo 90/10: aproximadamente 90% neutros y contenido, 10% marca. El amarillo se reserva para **una** cosa por pantalla —publicar, o destacar, nunca ambas— porque es el color más saturado del sistema y compite con todo.

---

## 2. Uso del amarillo

El amarillo es tu diferenciador real (casi ningún marketplace lo usa como acento primario) y también tu mayor riesgo: es el color más difícil de usar bien porque nunca admite texto claro.

**Permitido:** fondo de CTA Publicar con texto tinta; badge "Destacado"; anillo de historias; subrayado de elemento activo; acento en el mesh.
**Prohibido:** texto amarillo sobre blanco (falla contraste en cualquier paso claro); dos superficies amarillas grandes en la misma pantalla; amarillo como color de estado (se confunde con advertencia).

---

## 3. Categorías — una sola fuente

Hoy hay dos tablas en conflicto (`--cat-*` en CSS y `lib/categoria-theme.ts`), con divergencia en `empleos` y `negocios`. Se resuelve así: **la fuente es TypeScript, y de ahí se generan las CSS vars en build.** Nadie edita `--cat-*` a mano.

### Criterios de asignación de color

1. Separación mínima de 35° de matiz entre categorías vecinas, para que sean distinguibles de un vistazo.
2. Ninguna categoría a menos de 25° del matiz de marca (218°), para que un chip de categoría no se confunda con un elemento del sistema. **Esto obliga a mover `vehiculos` y `comunidad`, que hoy están casi encima del celeste de marca.**
3. Cada color debe pasar 3:1 sobre `bg-surface` en claro y en oscuro. Se define un par por modo.
4. Gris prohibido como color de categoría: el gris es ausencia de señal. Por eso `empleos` en `#64748b` no comunica nada.

### Tabla propuesta

| Categoría | Matiz | Claro | Oscuro | Fondo claro | Cambio |
|---|---|---|---|---|---|
| empleos | 175 | `#0F766E` | `#5EEAD4` | `#F0FDFA` | resuelve conflicto a favor del teal |
| inmuebles | 150 | `#047857` | `#6EE7B7` | `#ECFDF5` | ajuste menor por contraste |
| vehiculos | 25 | `#C2410C` | `#FDBA74` | `#FFF7ED` | **cambia** — estaba encima de la marca |
| servicios | 60 | `#A16207` | `#FCD34D` | `#FFFBEB` | ajuste de matiz |
| productos | 350 | `#BE123C` | `#FDA4AF` | `#FFF1F2` | sin cambio real |
| eventos | 285 | `#7E22CE` | `#D8B4FE` | `#FAF5FF` | sin cambio real |
| negocios | 255 | `#4F46E5` | `#A5B4FC` | `#EEF2FF` | resuelve conflicto a favor del índigo |
| comunidad | 320 | `#A21CAF` | `#F0ABFC` | `#FDF4FF` | **cambia** — estaba encima de la marca |

**Opción de cambio mínimo** (si prefieres no mover lo que la gente ya reconoce): arreglar solo `empleos` → `#0F766E`, `negocios` → `#4F46E5`, y desplazar `comunidad` a `#A21CAF`. Deja `vehiculos` en azul asumiendo el riesgo de confusión con la marca. Es una decisión reversible y barata de probar (experimento E3 en `13`).

### Reglas de uso

Acento de 3px en borde o barra lateral, nunca inundación de fondo — la regla que ya tenías es correcta y se conserva. Chip con fondo tenue del color de categoría y texto en el paso oscuro. **Siempre acompañado de ícono y etiqueta:** el color nunca es la única señal.

**Placeholders de categoría en oscuro:** hoy todos colapsan a `#283038`. Se restaura el color por categoría usando el fondo oscuro de la tabla, que es lo que el spec pedía y da identidad a los estados de carga.

---

## 4. Modo oscuro

Tres reglas que ya cumples parcialmente y que se formalizan.

**Nunca negro puro ni blanco puro.** Canvas `#12171B`, texto `#E9EEF2`. El negro puro con texto blanco produce halación (el texto vibra y deja estela) y cansa; en OLED además exagera el contraste.

**Elevación por luminosidad.** Canvas < superficie < superficie elevada. Tu estructura actual es correcta; solo se renombran los tokens para que el nombre indique el rol y no el valor.

**Menos croma en oscuro.** Los colores saturados vibran sobre fondo oscuro. Todas las rampas bajan croma entre 15% y 25% en modo oscuro, generado automáticamente en el pipeline.

**Meta theme-color:** claro `#FFFFFF`, oscuro `#12171B`. El manifest de la PWA usa `#53ACC5`.

---

## 5. Theming multi-tenant (storefront)

Aquí está el cambio arquitectónico más importante del documento.

**Problema actual:** `buildBusinessThemeVars()` sobrescribe `--bg-*`, `--text-*` y `--border-*` del scope del perfil. Eso significa que cualquier componente compartido entre marketplace y storefront se comporta distinto según dónde esté montado, y que un color mal elegido por un cliente puede volver ilegible un componente del sistema.

**Solución: contrato de tema cerrado.**

```css
/* El tenant SOLO puede definir estos 5 valores */
[data-tenant] {
  --bs-tenant-seed:    #2d6a4f;   /* color elegido por el negocio */
  --bs-tenant-mode:    light | dark;
  --bs-tenant-radius:  sharp | rounded | pill;
  --bs-tenant-density: compact | comfortable;
  --bs-tenant-accent:  solid | outline | gradient;
}
```

De ahí el sistema **deriva** —no acepta— el resto:

```ts
export function derivarTemaTenant(seed: string, mode: Mode) {
  let { l, c, h } = oklch(seed)!;
  c = Math.min(c ?? 0, 0.19);                    // limita croma: evita neones ilegibles
  const lAccion = mode === 'light'
    ? clamp(l, 0.42, 0.60)                        // rango que pasa AA con blanco
    : clamp(l, 0.62, 0.80);                       // rango que pasa AA con tinta
  const accion = hex({ l: lAccion, c, h });
  return {
    '--bs-action':        accion,
    '--bs-action-hover':  hex({ l: lAccion - 0.06, c, h }),
    '--bs-fg-on-action':  contrast(accion, '#fff') >= 4.5 ? '#fff' : '#0B1418',
    '--bs-action-subtle': hex({ l: mode==='light' ? 0.96 : 0.20, c: Math.min(c,.05), h }),
    '--bs-identity':      seed,   // el color tal cual, solo para logo y acentos
  };
}
```

**Lo que el tenant nunca puede cambiar:** fondos de superficie, colores de texto, colores semánticos de estado, bordes del sistema, tipografía, radios fuera de las tres opciones, ni el chrome de Buscadis.

*Por qué esta restricción es una función y no una limitación:* la personalización libre produce perfiles feos e ilegibles, y un perfil feo no se comparte. La personalización con guardarraíles produce perfiles que se sienten propios y siguen siendo reconociblemente Buscadis — que es lo que permite que la confianza se transfiera de un perfil a otro. Es el mismo razonamiento por el que Shopify limita los temas y Notion limita los colores.

### Presets

Los cinco presets actuales se conservan como *semillas* del contrato, no como sistemas completos:

| Preset | Semilla | Modo | Radio | Densidad |
|---|---|---|---|---|
| buscadis | `#53ACC5` | claro | rounded | cómoda |
| ejecutivo | `#1E3A5F` | claro | rounded | cómoda |
| minimal | `#171717` | claro | sharp | compacta |
| orgánico | `#2D6A4F` | claro | pill | cómoda |
| nocturno | `#7C3AED` | oscuro | rounded | cómoda |

Se renombra `cyberpunk` a `nocturno`: el nombre anterior fija una estética que el preset no entrega y que no encaja con ningún rubro real de tu cartera.

---

## 6. Contraste como puerta de CI

Se genera automáticamente una matriz de todos los pares (color de texto × superficie) en ambos modos y en los cinco presets. El build falla si algún par en uso baja de:

| Uso | Mínimo |
|---|---|
| Texto normal | 4.5:1 |
| Texto ≥24px o ≥19px bold | 3:1 |
| Bordes de componentes, íconos informativos | 3:1 |
| Estados de foco | 3:1 contra el fondo adyacente |

*Por qué automatizarlo:* la accesibilidad revisada a ojo se degrada en semanas. Revisada por CI, no se degrada nunca.
