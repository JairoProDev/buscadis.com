# 🛠️ Corrección de UX en Chatbot

## ✅ Cambios Implementados

### 1. Navegación al Sidebar
Al hacer clic en un adiso dentro del chat, ahora ocurre lo siguiente:
- **El chat se cierra/minimiza automáticamente.**
- **La aplicación navega a la URL del adiso.**
- Esto permite ver el detalle del adiso en la interfaz principal (sidebar) en lugar de una ventana modal comprimida dentro del chat.

### 2. Archivos Modificados
- `components/ChatbotInteractivo.tsx`:
  - Eliminado `ModalAdiso` interno.
  - Implementado `useRouter` y `getAdisoUrl`.
  - Nueva prop `onMinimize`.
- `components/FloatingChatbot.tsx`:
  - Pasa la función de cerrar chat al componente interactivo.
- `lib/chatbot-nlu.ts`:
  - Mejorado diccionario de sinónimos y categorías.
  - Añadido sistema de pesos para desambiguación ("hogar", "agencia").
- `lib/busqueda-mejorada.ts`:
  - Implementada estrategia FuzzySearch + Ranking en JavaScript.
  - Mayor "Recall" (trae más candidatos) y mejor "Precision" (ordena inteligentemente).

## 🚀 Cómo Probar

1. **Reinicia el servidor** (se hace automático).
2. **Abre el Chatbot**.
3. **Busca algo** (ej: "trabajadora de hogar" o usa botones).
4. **Haz clic en un resultado**.
5. **Resultado esperado**: El chat se cierra y ves el adiso en el panel principal (sidebar) de la web.

## 🎯 Objetivo Logrado
- Chatbot profesional con NLU avanzado.
- Búsqueda híbrida (Botones + Texto).
- UX fluida (Click -> Navegación).
