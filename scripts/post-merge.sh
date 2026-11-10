#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
lock_hash="$(sha256sum package.json package-lock.json | sha256sum | cut -d ' ' -f 1)"
install_marker="node_modules/.gridiron-post-merge-lock-hash"

if [ ! -f "$install_marker" ] || [ "$(cat "$install_marker")" != "$lock_hash" ]; then
  npm ci --no-audit --no-fund
  printf '%s\n' "$lock_hash" > "$install_marker"
fi

npm run build
