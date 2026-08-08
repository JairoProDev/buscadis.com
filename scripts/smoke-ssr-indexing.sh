#!/usr/bin/env bash
# Smoke: SSR indexing — fail if critical routes only show loading shells.
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-${1:-http://127.0.0.1:3000}}"
BASE_URL="${BASE_URL%/}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

check_route() {
  local path="$1"
  local expect_re="$2"
  local label="$3"
  local body
  body="$(curl -fsSL --max-time 45 "${BASE_URL}${path}")" || fail "${label} (${path}): request failed"
  if [[ -z "$body" ]]; then
    fail "${label} (${path}): empty response"
  fi
  local text
  text="$(printf '%s' "$body" | tr '\n' ' ')"
  if echo "$text" | grep -Eiq 'Cargando(\.\.\.|…)?[[:space:]]*</' && ! echo "$text" | grep -Eiq "$expect_re"; then
    fail "${label} (${path}): looks like loading-only HTML"
  fi
  if ! echo "$text" | grep -Eiq "$expect_re"; then
    fail "${label} (${path}): missing expected content /${expect_re}/"
  fi
  echo "OK: ${label} (${path})"
}

echo "Smoke SSR against ${BASE_URL}"

check_route "/" "ItemList|Avisos recientes|/a/" "Home"
check_route "/categoria/productos" "ItemList|Productos|/a/" "Category"

HOME_HTML="$(curl -fsSL --max-time 45 "${BASE_URL}/")"
ADISO_PATH="$(printf '%s' "$HOME_HTML" | grep -oE '/a/[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)?' | head -n1 || true)"
if [[ -n "$ADISO_PATH" ]]; then
  check_route "$ADISO_PATH" "Product|application/ld\+json" "Adiso detail"
else
  echo "WARN: no /a/ link found on home — skip detail check"
fi

BIZ_SLUG="${SMOKE_BUSINESS_SLUG:-buscadis}"
if curl -fsSL --max-time 45 "${BASE_URL}/negocio/${BIZ_SLUG}" | tr '\n' ' ' | grep -Eiq "LocalBusiness|application/ld\+json"; then
  echo "OK: Business profile (/negocio/${BIZ_SLUG})"
else
  echo "WARN: business /negocio/${BIZ_SLUG} not verified (set SMOKE_BUSINESS_SLUG)"
fi

echo "Smoke SSR indexing passed."
