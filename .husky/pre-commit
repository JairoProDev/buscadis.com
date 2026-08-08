#!/usr/bin/env sh
# Pre-commit: if token sources changed, rebuild and verify contrast before commit.
# Install: ln -sf ../../packages/tokens/scripts/pre-commit.sh .git/hooks/pre-commit
# Or copy into .husky/pre-commit when husky is adopted.

set -e

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

CHANGED="$(git diff --cached --name-only -- 'packages/tokens/src/**' 'packages/tokens/scripts/**' || true)"

if [ -z "$CHANGED" ]; then
  exit 0
fi

echo "[tokens] source changed — rebuilding and verifying contrast…"
npm run tokens:build

# Stage regenerated dist so the commit stays consistent
git add packages/tokens/dist/

echo "[tokens] OK"
