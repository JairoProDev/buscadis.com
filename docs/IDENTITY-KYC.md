# KYC identidad (DNI + selfie)

Para publicar / negocio / rider hace falta verificación con fotos (no basta el padrón).

## Usuario

1. Valida DNI en onboarding + WhatsApp  
2. En **Perfil** sube: DNI frente, DNI reverso, selfie con el DNI  
3. **Enviar a verificación** → estado `pending`  
4. Admin aprueba → `es_verificado` + puede publicar  

También se compara el nombre de Google con el del padrón (`name_match_score`). Si es bajo, el admin lo ve marcado.

## Admin

- URL: `/admin/identity`  
- Aprobar / rechazar con motivo  
- Requiere `rol=admin` o email en `PLATFORM_ADMIN_EMAILS`

## APIs

- `POST /api/identity/kyc/docs` (multipart: tipo + file)  
- `POST /api/identity/kyc/submit`  
- `GET /api/identity/kyc/docs`  
- `GET|PATCH /api/admin/identity-kyc`  
