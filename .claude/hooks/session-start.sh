#!/bin/bash
# Installs the merchant console's npm dependencies so tests and lint work
# in Claude Code cloud sessions. Skips the install when nothing that
# decides what gets installed has changed since the last successful run.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}/build-battle/merchant-console"

# The hash file lives inside node_modules (git-ignored), so it disappears
# with the packages and a fresh container always reinstalls.
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  # Delete the old hashes first, so a failed install runs again next time.
  rm -f "$hashes"

  # npm ci installs exactly what the lockfile pins and never rewrites it,
  # so sessions do not start with a modified package-lock.json.
  npm ci --no-audit --no-fund

  sha256sum ../../.claude/hooks/session-start.sh package.json package-lock.json \
    > "$hashes" || rm -f "$hashes"
fi
