#!/usr/bin/env bash
#
# Judge0 CE Test Suite Runner
# ----------------------------
# Usage:
#   export JUDGE0_URL=http://localhost:2358
#   export JUDGE0_AUTH_TOKEN=your_token_here
#   ./scripts/judge0-test.sh
#
# Or pass values inline:
#   JUDGE0_URL=http://localhost:2358 JUDGE0_AUTH_TOKEN=token ./scripts/judge0-test.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Defaults ──────────────────────────────────────────────────────────────
JUDGE0_URL="${JUDGE0_URL:-http://localhost:2358}"
JUDGE0_AUTH_TOKEN="${JUDGE0_AUTH_TOKEN:-}"
JUDGE0_POLL_INTERVAL="${JUDGE0_POLL_INTERVAL:-300}"
JUDGE0_RESULTS_TIMEOUT="${JUDGE0_RESULTS_TIMEOUT:-120000}"
JUDGE0_REQUEST_TIMEOUT="${JUDGE0_REQUEST_TIMEOUT:-30000}"

# ── Try loading from .env in infra/judge0 ─────────────────────────────────
ENV_FILE="${PROJECT_ROOT}/infra/judge0/.env"
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    case "$key" in
      JUDGE0_AUTH_TOKEN)  JUDGE0_AUTH_TOKEN="${value:-$JUDGE0_AUTH_TOKEN}" ;;
      JUDGE0_PORT)        if [ -z "${JUDGE0_URL:-}" ] || [ "$JUDGE0_URL" = "http://localhost:2358" ]; then
                            JUDGE0_URL="http://localhost:${value:-2358}"
                          fi ;;
    esac
  done < "$ENV_FILE"
fi

# ── Print configuration ───────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║          Judge0 CE — End-to-End Test Runner            ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  JUDGE0_URL:              $JUDGE0_URL"
echo "  JUDGE0_AUTH_TOKEN:       $([ -n "$JUDGE0_AUTH_TOKEN" ] && echo '**** (set)' || echo '(not set)')"
echo "  JUDGE0_POLL_INTERVAL:    ${JUDGE0_POLL_INTERVAL}ms"
echo "  JUDGE0_RESULTS_TIMEOUT:  ${JUDGE0_RESULTS_TIMEOUT}ms"
echo "  JUDGE0_REQUEST_TIMEOUT:  ${JUDGE0_REQUEST_TIMEOUT}ms"
echo ""
echo "  Starting tests at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo ""

# Quick health check before running full suite
if command -v curl &>/dev/null; then
  echo -n "  Health check: "
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$JUDGE0_URL/about" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "OK ($JUDGE0_URL/about → 200)"
  else
    echo "WARNING ($JUDGE0_URL/about → HTTP $HTTP_CODE)"
    echo "  The server may not be ready. Tests may fail."
  fi
  echo ""
fi

# ── Locate Node.js ────────────────────────────────────────────────────────
NODE=""
for candidate in node nodejs /usr/local/bin/node /usr/bin/node; do
  if command -v "$candidate" &>/dev/null; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo "  ERROR: Node.js is required but not found."
  echo "  Install Node.js 18+ from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$("$NODE" --version 2>/dev/null || echo "unknown")
echo "  Node.js: $NODE_VERSION"
echo ""

if [[ "$NODE_VERSION" =~ ^v([0-9]+) ]]; then
  if [ "${BASH_REMATCH[1]}" -lt 18 ]; then
    echo "  WARNING: Node.js 18+ is recommended (found $NODE_VERSION)."
    echo "  The fetch API may not be available natively."
    echo ""
  fi
fi

# ── Run the test suite ────────────────────────────────────────────────────
export JUDGE0_URL
export JUDGE0_AUTH_TOKEN
export JUDGE0_POLL_INTERVAL
export JUDGE0_RESULTS_TIMEOUT
export JUDGE0_REQUEST_TIMEOUT

exec "$NODE" "$SCRIPT_DIR/judge0-test.mjs"
