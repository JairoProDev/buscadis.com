# Play Store Publication Runbook (Buscadis)

## Mobile app repo
Native client (Expo WebView shell): `~/proyectos/sdk/buscadis-mobile`  
Step-by-step checklist: `buscadis-mobile/PLAY_STORE_READY.md`

## Goal
Ship Android app release safely with policy-compliant metadata and operational readiness.

## 1) Pre-flight
- Verify web production is live on `https://buscadis.com`.
- Verify deletion page works: `https://buscadis.com/account-deletion`.
- Confirm API health:
  - `POST /api/mobile-analytics`
  - `POST /api/mobile-push/register`
  - `POST /api/account-deletion-request`

## 2) Supabase
- Apply latest migrations:
  - `007_account_deletion_requests.sql`
  - `008_account_deletion_admin_fields.sql`
- Confirm tables exist:
  - `account_deletion_requests`
  - `mobile_analytics_events`
  - `expo_push_tokens`

## 3) Required env vars (Vercel)
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOBILE_INGEST_SECRET`
- `MOBILE_PUSH_ADMIN_SECRET`
- `EXPO_ACCESS_TOKEN`
- `ANDROID_APP_PACKAGE_NAME`
- `ANDROID_APP_LINKS_SHA256`
- `ADMIN_API_KEY` (recommended to protect admin APIs)

## 4) EAS
- Ensure `MOBILE_INGEST_SECRET` exists in EAS `production`.
- Build production bundle:
  - `eas build -p android --profile production`
- Download `.aab` from Expo build page.

## 5) Play Console answers (core)
- App access:
  - If restricted features exist (login/favorites/business page): provide reviewer account.
- Data deletion:
  - Delete account URL: `https://buscadis.com/account-deletion`
  - Delete data URL: `https://buscadis.com/account-deletion`

## 6) Release flow
- Internal testing first.
- Validate:
  - login
  - favorites
  - business page creation
  - deep links
  - push token registration
  - offline fallback
- Promote to production after validation.

## 7) Post-release operations
- Monitor:
  - Play Vitals
  - `mobile_analytics_events` growth
  - push token counts and delivery quality
- Process deletion requests regularly from `account_deletion_requests`.
