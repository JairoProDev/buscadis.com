# Decolecta — DNI y RUC (paso a paso)

El código ya consulta `https://api.decolecta.com/v1`. Sin token verás:
`API de identidad no configurada (DECOLECTA_API_TOKEN)`.

## 1. Crear cuenta (gratis ~1000 consultas/mes)

1. Abre https://decolecta.com (o https://apis.net.pe)
2. Regístrate con tu email
3. Copia el **token Bearer** del panel

## 2. Local

En `.env.local`:

```
DECOLECTA_API_TOKEN=tu_token_aqui
IDENTITY_DEV_MOCK=0
```

Reinicia `npm run dev`.

## 3. Producción (Vercel)

Proyecto **buscadis.com** (el de www.buscadis.com):

```bash
printf '%s' 'TU_TOKEN' | vercel env add DECOLECTA_API_TOKEN production
printf '%s' 'TU_TOKEN' | vercel env add DECOLECTA_API_TOKEN preview
vercel deploy --prod
```

O Dashboard → Settings → Environment Variables → `DECOLECTA_API_TOKEN`.

## 4. Probar

1. Entra a la app → onboarding → DNI de 8 dígitos → **Validar con SUNAT**
2. Debe devolver nombres (no el error de token)
3. Si activaste negocio, RUC 10/20 usa el mismo token

## Nota

No es API oficial RENIEC; padrón / fuentes públicas. Suficiente para MVP anti-fraude.
