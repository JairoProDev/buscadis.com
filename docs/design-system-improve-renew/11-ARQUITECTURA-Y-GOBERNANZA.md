# 11 — Arquitectura y gobernanza

---

## 1. Estructura de paquetes

```
packages/
  tokens/                 @buscadis/tokens
    src/
      primitive/          color.json  space.json  radius.json  type.json  motion.json
      semantic/           light.json  dark.json  categories.json
      component/          button.json  card.json  input.json
    build/                style-dictionary.config.js
    dist/                 tokens.css  tokens.ts  tokens.json  tailwind-preset.js
  ui/                     @buscadis/ui        ← 18 primitivas (Radix + CVA)
  marketplace-kit/        @buscadis/marketplace-kit  ← AdisoCard, composer, chrome
  storefront-kit/         @buscadis/storefront-kit   ← perfil de negocio, tenant
  profile-engine/         (ya existe — consume storefront-kit)
apps/
  web/                    Next.js (el repo actual)
```

**Por qué separar tokens de ui:** los tokens los consume también Figma, el generador de piezas físicas (QR, afiches), los correos transaccionales y las imágenes OG. Si viven dentro del paquete de componentes, nada de eso puede usarlos.

**Por qué separar marketplace de storefront:** restricciones opuestas. El marketplace es marca fija y densidad alta; el storefront es multi-tenant y densidad variable. Compartir el paquete es lo que produce hoy que el tema de negocio pise variables del shell.

---

## 2. Pipeline de tokens

**Style Dictionary** compila el JSON a cuatro salidas: `tokens.css` (variables), `tokens.ts` (objeto tipado), `tokens.json` (formato W3C Design Tokens, para Figma vía plugin) y `tailwind-preset.js` (el `theme` de Tailwind).

Cuatro transformaciones automáticas en el build:

**Generación de rampas en OKLCH.** Se define matiz base y croma; el build genera los 11 pasos con luminosidad uniforme. Nadie elige hex a mano.
**Derivación del modo oscuro.** Croma reducido entre 15% y 25%, superficies invertidas según la lógica de elevación.
**Verificación de contraste.** Todos los pares semánticos en uso; el build falla si alguno baja del mínimo.
**Generación de CSS vars de categorías** desde el módulo TypeScript único, eliminando la doble fuente actual.

`npm run tokens:build` corre en pre-commit y en CI. Un cambio de color es un PR con diff legible y changelog.

---

## 3. Documentación viva

**Storybook** con: una historia por variante de cada primitiva, una página de tokens que se genera desde el paquete (nunca escrita a mano), y un modo de "prueba de estrés" con contenido extremo (nombres de 60 caracteres, precios de seis cifras, sin foto).

**Addons imprescindibles:** `@storybook/addon-a11y` (axe en cada historia), viewport con el dispositivo de referencia de 360px preconfigurado, y modo de tema para alternar claro/oscuro/tenant.

**Regla:** un componente sin historia no está terminado. La historia es la prueba de que tiene sus cuatro estados.

---

## 4. Puertas de calidad en CI

| Puerta | Herramienta | Falla si |
|---|---|---|
| Contraste de tokens | script propio sobre `tokens.json` | algún par en uso < mínimo |
| Accesibilidad de componentes | axe en Storybook (`test-runner`) | violación seria o crítica |
| Hex sueltos | ESLint custom | hay un color literal fuera de `packages/tokens` |
| Íconos | ESLint custom | se importa de `lucide-react` fuera del registry |
| Peso del bundle | `size-limit` | supera el presupuesto de `15` |
| Core Web Vitals | Lighthouse CI | LCP > 1.8s o CLS > 0.05 en las 5 rutas clave |
| Regresión visual | Chromatic o Playwright + snapshots | diferencia no aprobada |
| Objetivo táctil | regla de Playwright sobre elementos interactivos | área < 44×44 |

**Por qué tanta automatización para un equipo de una persona:** precisamente porque eres una persona. Estas puertas son el equipo de revisión que no tienes, y son lo que evita que el sistema se degrade cuando delegues código a IAs.

---

## 5. Convenciones de código

**Nombres de tokens en inglés, contenido de interfaz en español.** El código internacional, el producto local.

**Sin `!important`** salvo en la regla de movimiento reducido.

**Sin estilos con margen propio en componentes.** El espaciado lo decide el contenedor.

**Sin props booleanas acumuladas.** `compact + embedded + isDesktop` se reemplaza por una prop de variante y contexto de densidad. *Por qué:* tres booleanas son ocho combinaciones, de las cuales probablemente cuatro nunca se probaron.

**Server Components por defecto**, `'use client'` solo donde hay interacción real. Es la palanca principal para bajar el JavaScript y para resolver el problema de indexación.

---

## 6. Versionado y cambios

**SemVer en `@buscadis/tokens`.** Renombrar o eliminar un token es un cambio mayor. Añadir es menor. Cambiar el valor de un token existente es menor si el rol se mantiene, mayor si cambia el significado.

**Depreciación con puente:** un token que se retira se mantiene un ciclo apuntando al nuevo, con aviso en consola en desarrollo.

**Excepciones con fecha.** Cualquier desviación se documenta en el PR con motivo y fecha de caducidad. Una excepción sin fecha se convierte en la deuda que hoy documenta tu archivo 09.

---

## 7. Figma

**Figma no es la fuente de verdad; el paquete de tokens lo es.** La biblioteca de Figma se alimenta desde `tokens.json` mediante el plugin de Tokens Studio o el importador de variables nativo.

*Por qué en este orden:* tu equipo hoy es una persona que trabaja con IAs de código. El diseño nace en código y en Claude Design, no en Figma. Invertir la dirección (Figma → código) te obligaría a mantener un artefacto que no está en tu flujo real.

Cuando haya diseñadores, la dirección puede invertirse. La estructura de tokens ya lo soporta.

---

## 8. Propiedad y proceso

**Dueño único:** tú, hasta que haya equipo. Un sistema con propiedad difusa es un sistema que diverge.

**Ruta de contribución:**
1. Un componente nuevo se propone con el caso de uso y dos ejemplos reales de pantalla.
2. Si se puede resolver con primitivas, no se crea.
3. Si es específico de una feature, vive en la feature — no todo tiene que estar en el sistema.
4. Solo entra al sistema lo que se usa en tres lugares o más.

**Revisión trimestral:** qué se usa, qué no, qué se duplicó fuera del sistema. Un componente sin uso en dos trimestres se archiva.
