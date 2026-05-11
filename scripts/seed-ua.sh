#!/bin/bash
# Seed Coveo Usage Analytics with curated queries so the QS model has data.
# Run AFTER provisioning the Query Suggestions model in Test Configuration Mode.
#
# Usage:  bash scripts/seed-ua.sh
#
# Reads COVEO_ORG_ID + COVEO_API_KEY from .env at the project root.

set -e
cd "$(dirname "$0")/.."

# Source .env safely
set -a
. ./.env
set +a

if [ -z "$COVEO_ORG_ID" ] || [ -z "$COVEO_API_KEY" ]; then
  echo "Set COVEO_ORG_ID + COVEO_API_KEY in .env"
  exit 1
fi

# Mint a runtime search token first
TOKEN=$(curl -sS -X POST \
  "https://platform.cloud.coveo.com/rest/search/v2/token?organizationId=${COVEO_ORG_ID}" \
  -H "Authorization: Bearer ${COVEO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"searchHub":"PokedexSearch","userIds":[{"name":"ua-seed","provider":"Email Security Provider","type":"User"}]}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

if [ -z "$TOKEN" ]; then
  echo "Could not mint search token"
  exit 1
fi

QUERIES=(
  "pikachu" "charizard" "mewtwo" "rayquaza" "lucario" "garchomp" "bulbasaur"
  "fire" "water" "grass" "electric" "psychic" "dragon" "dark" "fairy" "ghost"
  "legendary" "starter" "pseudo legendary" "mega evolution"
  "gen 1" "gen 2" "gen 3" "gen 4" "gen 5" "gen 6" "gen 7" "gen 8" "gen 9"
  "fastest pokemon" "highest attack" "best special attack" "tank pokemon"
)

echo "Seeding UA with ${#QUERIES[@]} queries via PokedexSearch..."
i=0
for q in "${QUERIES[@]}"; do
  i=$((i+1))
  curl -sS -o /dev/null -X POST \
    "https://${COVEO_ORG_ID}.org.coveo.com/rest/search/v2" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"q\":\"${q}\",\"cq\":\"@source==\\\"pokedex-push\\\"\",\"numberOfResults\":3}"
  printf "  %2d/%d  %s\n" "$i" "${#QUERIES[@]}" "$q"
  sleep 0.2
done

echo
echo "✓ UA seeded. Wait ~5 min for the QS model to incorporate the queries,"
echo "  then reload the live site and confirm suggestions render."
