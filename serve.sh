#!/usr/bin/env bash
# Palinode — local server
#
# Palinode does not need one: it is classic <script> tags with no modules
# and no fetch, so opening index.html directly works, media and all.
# This exists for the two cases where a server does help:
#   · Cursor / editor live preview
#   · opening the 3D view on a phone or tablet on the same wifi
#
#   ./serve.sh          → port 8137
#   ./serve.sh 3000     → port 3000

set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8137}"

LAN=""
for i in en0 en1 en2; do
  LAN=$(ipconfig getifaddr "$i" 2>/dev/null || true)
  [ -n "$LAN" ] && break
done

printf '\n  Palinode\n\n'
printf '    this mac   http://localhost:%s\n' "$PORT"
[ -n "$LAN" ] && printf '    this wifi  http://%s:%s\n' "$LAN" "$PORT"
printf '\n    ctrl-c to stop\n\n'

exec python3 -m http.server "$PORT" --bind 0.0.0.0
