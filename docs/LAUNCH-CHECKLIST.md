# 🚀 LAUNCH CHECKLIST — buscadis.com

**Status:** ✅ IMPLEMENTADO Y DEPLOYADO

---

## 1. AUTENTICACIÓN (Google One Tap)

### ✅ Completado
- Google OAuth con One Tap (sin supabase.co en la UI)
- Server-side session management
- Env var: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (en Vercel)

### Qué testear
1. Ir a **https://www.buscadis.com**
2. Hace click en **"Entrar con Google"** o **"Crear cuenta"**
3. Verifica que se abre **Google One Tap** (no redirección a supabase.co)
4. Después del login: **sin onboarding muro** (primera sesión solo Google)

---

## 2. IDENTIDAD (progressive profiling)

Ver detalle: [`docs/PERFIL-EVOLUTIVO.md`](./PERFIL-EVOLUTIVO.md)

### ✅ Completado
- Primera sesión: solo Google
- Visitas siguientes: 1 prompt omitible (X) — WhatsApp → demografía → DNI → intents
- Validación DNI (Decolecta) + WhatsApp OTP (logs si no hay Meta)
- Env: `DECOLECTA_API_TOKEN` + `OTP_DEV_LOG=1`

### Qué testear
1. Login nuevo → no modal
2. Cerrar navegador / nueva sesión → aparece WhatsApp (X omite 48h)
3. Completar un dato → ese prompt no vuelve
4. Publicar sigue exigiendo KYC

---

## 3. KYC (Fotos DNI + Selfie)

### ✅ Completado
- Upload de documentos (DNI frente, reverso, selfie)
- Admin review en `/admin/identity`
- Name match score (Google vs padrón)

### Qué testear
1. Después del onboarding, ve a **Perfil** → **Verificación**
2. Sube:
   - Foto del DNI frente
   - Foto del DNI reverso
   - Selfie contigo y el DNI
3. Haz click en **"Enviar a verificación"**
4. Como admin: ve a **https://www.buscadis.com/admin/identity**
5. Aprobar → usuario puede publicar

### Admin credentials
- Email en `PLATFORM_ADMIN_EMAILS` (Supabase config)
- O usuario con `rol=admin`

---

## 4. CAPACIDADES (Publish / Business / Rider)

### ✅ Completado
- Multi-rol: usuarios pueden tener publish + business + rider + influencer
- KYC gate: no publican sin aprobación
- Capabilities grid en perfil: **Tus espacios**

### Qué testear
1. Crea dos usuarios:
   - **Usuario A:** solo busca (no publica)
   - **Usuario B:** completa KYC → pide activar "Puedo publicar"
2. Usuario B debe ver **"Verificación pendiente"** hasta que admin apruebe
3. Una vez aprobado: puede publicar, usar rider, etc.

---

## 5. ISSUES CONOCIDOS (Y CÓMO RESOLVERLOS)

### ❌ "WhatsApp no está configurado" en dev
- **Motivo:** Falta `WHATSAPP_API_TOKEN`
- **Solución:** Eso es OK ahora, OTP va a logs con `OTP_DEV_LOG=1`

### ❌ "DNI no encontrado" siempre
- **Motivo:** Token Decolecta inválido o expirado
- **Check:** `vercel env ls` → `DECOLECTA_API_TOKEN` debe estar
- **Solución:** Si no está, ver `/docs/DECOLECTA-SETUP.md`

### ❌ KYC upload sin funcionar
- **Motivo:** Falta bucket `identity-kyc` en Supabase
- **Check:** Dashboard Supabase → Storage → debe haber `identity-kyc`
- **Solución:** Migración `044_identity_kyc.sql` ya la crea

---

## 6. SIGUIENTES PASOS (DESPUÉS DE TESTEAR)

### Integración WhatsApp (cuando tengas $)
1. Crear Business Account en Meta
2. Obtener API token + numero de teléfono
3. Agregar variables en Vercel:
   - `WHATSAPP_API_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_WEBHOOK_SECRET`
4. Cambiar `OTP_DEV_LOG=0`
5. Redeploy

### Notificaciones push (después)
- Setup Expo push tokens
- Webhooks para new deals, messages, etc.

### Verificación por video (después)
- Integrar Liveness API (algún provider)
- Gate más fuerte para business/rider

---

## 7. AMBIENTE ACTUAL

| Variable | Local | Producción | Estado |
|----------|-------|-----------|--------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | ✅ | Funcionando |
| `DECOLECTA_API_TOKEN` | ✅ | ✅ | Funcionando |
| `OTP_DEV_LOG` | ✅ (1) | ✅ (1) | Logs activos |
| `WHATSAPP_API_TOKEN` | ❌ | ❌ | Fallback a logs |

---

## 8. URLs IMPORTANTES

- **Sitio:** https://www.buscadis.com
- **Admin (identidad):** https://www.buscadis.com/admin/identity
- **Perfil (usuario):** https://www.buscadis.com/perfil
- **Docs:** [`docs/`](../)

---

**📌 Resumen:** TODO IMPLEMENTADO Y DEPLOYADO. Solo falta testear + considerar WhatsApp cuando tengas budget.
