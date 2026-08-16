#!/usr/bin/env bash
# SEO-002 smoke: robots.txt + sitemap.xml on the shop origin.
# Does not prove production indexing (needs GA_ALLOW_INDEXING=true).
set -euo pipefail

ORIGIN="${1:-${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}}"
ORIGIN="${ORIGIN%/}"

echo "GET ${ORIGIN}/robots.txt"
curl -fsS -D - "${ORIGIN}/robots.txt" -o /tmp/ga-robots.txt | head -n 20
echo "--- body ---"
head -n 40 /tmp/ga-robots.txt
echo

echo "GET ${ORIGIN}/sitemap.xml"
curl -fsS -D - "${ORIGIN}/sitemap.xml" -o /tmp/ga-sitemap.xml | head -n 20
echo "--- body (first 40 lines) ---"
head -n 40 /tmp/ga-sitemap.xml
echo
echo "OK: fetched robots + sitemap from ${ORIGIN}"
