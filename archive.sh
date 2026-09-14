#!/bin/sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
OUT=${1:-"$ROOT_DIR/../signalharvester-web-FULL.zip"}
cd "$ROOT_DIR/.."
rm -f "$OUT"
zip -qr "$OUT" signalharvester-web \
  -x 'signalharvester-web/.git/*' \
  -x 'signalharvester-web/.idea/*' \
  -x 'signalharvester-web/node_modules/*' \
  -x 'signalharvester-web/dist/*' \
  -x 'signalharvester-web/coverage/*' \
  -x 'signalharvester-web/test-results/*' \
  -x 'signalharvester-web/playwright-report/*' \
  -x 'signalharvester-web/blob-report/*' \
  -x 'signalharvester-web/.vite/*' \
  -x 'signalharvester-web/.env' \
  -x 'signalharvester-web/.env.local' \
  -x 'signalharvester-web/.DS_Store'
echo "$OUT"
