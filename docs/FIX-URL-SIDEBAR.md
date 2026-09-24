# 🛠️ Corrección de URL y Renderizado Sidebar

## 🐛 Problema Detectado
Al abrir un adiso desde el Chatbot (o cualquier parte que usara `abrirAdiso`), ocurría un conflicto en la URL:
1. La App establecía `/?adiso=ID`.
2. El componente `ModalAdiso` forzaba la URL SEO completa `/ubicacion/categoria/slug`.
3. Este cambio borraba los parámetros de consulta (`?adiso=ID`).
4. La App detectaba la pérdida del parámetro y asumía que se había cerrado el adiso, renderizando un **sidebar vacío**.

## ✅ Solución Implementada

### 1. `components/ModalAdiso.tsx`
Se modificó el `useEffect` que gestiona la actualización de la URL para que sea **condicional**:

```typescript
useEffect(() => {
  // Solo actualizar a URL SEO si NO estamos dentro del sidebar
  if (adiso && !dentroSidebar) {
    // ... lógica de cambio de URL ...
  }
}, [adiso, dentroSidebar]);
```

### 2. Comportamiento Resultante
- **Navegación Interna (SPA):** Al hacer clic en un adiso, la URL cambia a `/?adiso=ID`. El sidebar se abre correctamente sin recargar la página y muestra el contenido.
- **Navegación Directa/SEO:** Si se accede a la URL completa `/ubicacion/categoria/slug`, la página dedicada se carga normalmente.
- **Chatbot:** Ahora navega usando el contexto interno, asegurando una transición suave desde el chat al sidebar.

## 🚀 Impacto en la Experiencia
- **Cero parpadeos.**
- **Sidebar funcional** y con contenido.
- **Mejor rendimiento** al evitar manipulaciones innecesarias del historial del navegador.
