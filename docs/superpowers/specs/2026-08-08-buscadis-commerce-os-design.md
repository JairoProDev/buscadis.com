# Buscadis Commerce OS — design freeze

**Fecha:** 2026-08-08  
**Estado:** freeze de doctrina (centro comercial digital)  
**Relacionado:** Hybrid 3.0 vitrina; este doc congela **transacción** como norte.

## Norte

Objetivo #1 = **transacción** (pedido, reserva, cotización convertida, pago iniciado o lead de compra medible). Stories, about, mapa e IA son infraestructura de venta.

Criterio dueño (alquiler): *“esto me trae pedidos / citas / cotizaciones.”*

## Alquiler de vitrina

| Plan | Precio | Analogía | Capacidad clave |
|------|--------|----------|-----------------|
| Free | S/0 | Pasillo / muestra | ≤10 productos, lead WA básico |
| Pro | S/30/mes | Local chico | Catálogo ilimitado, pedidos, prioridad search/mapa |
| Max | S/300/mes | Local ancla + personal | Checkout pago, ADIS AI local, autoservicio |

Publicar perfil completo = Pro+. Free no simula un local Pro.

## Funnel canónico

```
profile_view → product_view → purchase_intent | add_to_cart
  → order_created | handoff (WA)
  → order_confirmed | order_paid | lead_won
```

### Eventos `page_analytics`

| event_type | Cuándo |
|------------|--------|
| `profile_view` / `page_view` | Abre perfil |
| `product_view` | Abre ficha / sheet producto |
| `purchase_intent` | CTA Pedir/Consultar/Agendar/Cotizar (sin ítems aún) |
| `add_to_cart` | Agrega ítem al carrito PV |
| `order_created` | Pedido persistido (WA o checkout) |
| `order_paid` | MP webhook o dueño marca pagado |
| `whatsapp_click` | Handoff `/r/` o wa.me |
| `ia_unanswered` | Corpus FAQ dueño |

## Composición (sobre Hybrid 3.0)

1. Oferta (catálogo/servicios) protagonista del fold.  
2. Sticky CTA por arquetipo: Pedir / Agendar / Cotizar / Consultar.  
3. Una primaria WA en barra; carrito como intent de pedido.  
4. Sin vanity stats; QR vanity fuera del perfil público.

## Pedido estructurado (MVP)

- Tabla `commerce_orders` (+ items JSONB).  
- Estados: `draft | sent_wa | confirmed | preparing | paid | delivered | cancelled`.  
- Carrito en Perfil Vivo → “Enviar pedido por WhatsApp” → mensaje con ítems + fila en `/mi-negocio/pedidos`.  
- Pago offline (Yape/Plin) confirmado por dueño antes de liquidación MP completa.

## Entitlements

- Free: máx. 10 productos activos/publicados.  
- Pro+: carrito / pedidos / reservas.  
- Max: checkout MP catalog, agente LLM del local.

## No hacer

Bottom-nav app, stats inventadas, WA Business API antes de orders + agente web, diluir fold con chrome de directorio.
