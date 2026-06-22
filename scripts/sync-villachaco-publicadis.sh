#!/usr/bin/env bash
# Sincroniza el sitio estático Villa Chaco a PublicAdis-nextjs (publicadis.com/p/villachaco)
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)/public/villachaco"
DEST="$(cd "$(dirname "$0")/../../PublicAdis-nextjs" && pwd)/public/villachaco"

echo "→ Villa Chaco: $SRC → $DEST"
rsync -a --delete "$SRC/" "$DEST/"
echo "✓ $(find "$DEST" -type f | wc -l) archivos en PublicAdis-nextjs/public/villachaco/"
