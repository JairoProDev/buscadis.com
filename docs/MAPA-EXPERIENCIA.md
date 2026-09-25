# Mapa Buscadis

## Qué resuelve

Un anuncio con coordenadas, o con un distrito de Cusco reconocible, entra al mapa en cuanto se guarda. El visitante explora por zona, filtra y abre la ficha sin cargar el catálogo entero en el navegador.

## Flujo

1. Publicar guarda `latitud` / `longitud`. Si el anunciante solo escribió un distrito, `adisoToDb` usa el centro de ese distrito.
2. `/mapa` y el mapa del sidebar piden `GET /api/map/listings?south&west&north&east`.
3. La API devuelve pines ya desplazados: negocios y eventos con punto real van al local; inmuebles, vehículos, empleos y el resto se muestran como zona estable (el mismo anuncio no salta de lugar).
4. El cliente agrupa por zoom. Mover el mapa no recarga solo: aparece **Buscar en esta zona**.
5. En escritorio, la página `/mapa` muestra lista al lado. En móvil, ficha inferior con Ver anuncio, WhatsApp y, solo en locales exactos, Cómo llegar.

## Privacidad

La respuesta del mapa no incluye la dirección ni el punto original de un inmueble. “Cómo llegar” solo existe cuando la precisión es exacta.

## Coste

Tiles por defecto: OpenStreetMap. Con `NEXT_PUBLIC_CARTO_API_KEY` se usa CARTO Voyager. No hay Google Maps en este corte.
