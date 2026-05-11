# Handoff — Coveo FDE Technical Challenge

> A single document that any reviewer (or a fresh Claude session) can open
> cold and understand: what was asked, what shipped, what didn't, why,
> and how to verify it for themselves.

---

## TL;DR

Take-home for the **Forward Deployed Engineer** role at Coveo. The asks were
the *Pokémon Challenge* (build a Coveo-powered search over `pokemondb.net`,
indexable Pokémon pages only, with Type + Generation facets, image-rich
result cards, and ML on top) plus a *panel presentation* on architecture
(Topic 1) and a *SEV-1 escalation scenario* (Topic 2).

Status: **Essential ✅, Intermediate ✅, Advanced ✅ (with two ML features
license-gated on the trial org), Bonus ✅ shipped as code (also
license-gated).** Both presentations and a 747-line speaker-notes file are
done.

**Self-assessment against the brief: 9 / 10.** The missing point is the
*live demonstration* of RGA and Passage Retrieval, both of which require
upgrading the trial-org's license tier — a sales engagement, not a code gap.
Integration code for both is shipped end-to-end.

---

## Hard-asset coordinates

| Asset | Where |
| --- | --- |
| Live app | <https://pokemon-gold-rho.vercel.app> |
| GitHub (canonical) | <https://github.com/aacamara/coveo-pokemon> |
| GitHub (Vercel-watched mirror) | <https://github.com/aacamara/pokemon> |
| Topic 1 deck (Architecture) | `decks/topic-1-architecture.html` — 20 slides |
| Topic 2 deck (Escalation & Recovery) | `decks/topic-2-escalation.html` — 16 slides |
| Speaker notes + demo script + Q&A | `decks/panel-notes.md` — 747 lines |
| Coveo org | `azizfdepokemontestfhlqf1jz` (free trial) |
| Local workspace | `~/coveo-pokemon-challenge/` |
| Latest commit | `8f1fa87` (see `git log`) |

---

## Compliance audit against the original brief

### Pokémon Challenge — Essential (every item required)

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Accept Coveo Cloud Org invitation | ✅ | Trial org `azizfdepokemontestfhlqf1jz` is live; 3 API keys created (admin, runtime, push) — see `.env.example`. |
| 2 | Install Atomic or Headless locally | ✅ | `@coveo/atomic-react@3.1.7` + `@coveo/headless@3.4.1` in `package.json`. |
| 3 | Index pokémondb (or equivalent) using Cloud Platform | ✅ | **Three sources:** `pokedex-sandbox` (1 doc, iteration), `pokedex-full` (Web Crawler, 1,027 docs from pokémondb.net), `pokedex-push` (Push API, 1,025 docs from PokéAPI). UI queries the Push source for clean metadata. |
| 4 | Include only Pokémon pages (exclude Moves, Types, etc.) | ✅ | Crawler: address-pattern regex `^https://pokemondb\.net/pokedex/[a-z0-9-]+/?$`. Push: strict `id ∈ [1, 1025]`. |
| 5 | Web Crawler **or** Push source | ✅ | **Both** — Crawler narrates the brief verbatim; Push solves metadata gaps the V2 crawler couldn't extract. See `coveo/web-scraping-config.json` and `scripts/push-from-pokeapi.ts`. |
| 6 | Connect local search page to cloud endpoint | ✅ | `src/coveo/engine.ts` builds the headless engine; `/api/token` mints a search-token via the runtime key (the admin key never reaches the browser). |
| 7 | Facet by Pokémon Type | ✅ | Live, 18 types with real counts (`Water: 154, Normal: 131, Grass: 127…`). |
| 8 | Facet by Pokémon Generation | ✅ | Live, **9 generations summing to 1,025** (Gen 1=151, Gen 2=100, …, Gen 9=120). |
| 9 | Display Pokémon's picture in search result | ✅ | Canonical PokéAPI artwork URL on every doc; client-side derivation retained as a safety net (`src/coveo/derive.ts`). |

**Essential: 9/9.**

### Pokémon Challenge — Intermediate (every item required)

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 10 | Host code on GitHub | ✅ | <https://github.com/aacamara/coveo-pokemon> (public) and mirror at `aacamara/pokemon`. |
| 11 | Host search app to be accessible | ✅ | <https://pokemon-gold-rho.vercel.app> — public, no auth wall. |

**Intermediate: 2/2.**

### Pokémon Challenge — Advanced (optional but encouraged; justify if skipped)

| # | Requirement | Status | Evidence / Notes |
| --- | --- | --- | --- |
| 12 | Deploy Coveo RGA | ⚠️ License-gated | `<atomic-generated-answer />` wired in `src/pages/SearchPage.tsx`. **Trial-org tier does not include RGA** — provisioning the model in Admin requires a sales contact. Integration code is otherwise complete; the component lights up the moment the license is upgraded. |
| 13 | Preload Query Suggest model | ✅ | Model `"Pokedex Test"` (engine=`querysuggest`) provisioned **in Test Configuration Mode**, associated with the `Pokedex` pipeline, seeded with 33 curated queries via `scripts/seed-ua.sh`. |
| 14 | Pokémon Detail Page | ✅ | `/pokemon/:name` route — `src/pages/PokemonDetailPage.tsx`. Hero artwork + type pills + abilities + related-Pokémon strip. |
| 15 | Two-topic presentation | ✅ | Topic 1 (architecture deep-dive, 20 slides) and Topic 2 (escalation, 16 slides). Both decks at `decks/`. Speaker notes in `decks/panel-notes.md`. |

**Advanced: 3.5/4** (RGA license-gated; everything else done).

### Pokémon Challenge — Bonus

| # | Requirement | Status | Evidence / Notes |
| --- | --- | --- | --- |
| 16 | Build on the Passage Retrieval API | ⚠️ License-gated | Built end-to-end: `api/passages.ts` (Vercel function), `src/components/AskPokedex.tsx` (UI widget). **Trial-org tier does not include Passage Retrieval** — live calls return 403 `UNAUTHORIZED_ACCESS_TO_FEATURE`; UI shows a graceful "not enabled on this sandbox" message. Code, request payload, and a worked example are in Topic 1 deck slides 14–15. |

**Bonus: 0.5/1.**

### FDE Technical Challenge — Panel Presentation

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 17 | Topic 1: Technical deep-dive — *not a demo*. What is the Coveo configuration? Why this architecture? What was the decision-making process? | ✅ | 20-slide deck (`decks/topic-1-architecture.html`). Six-decisions table on slide 3. Architecture diagram on slide 4. Indexing strategy slides 5–7. UI + token-exchange slides 8–10. ML slides 11–13. Passage Retrieval slides 14–15. CSCX.AI enterprise-customer anchor slides 16–18 (covers the Pokémon Advanced "identify an enterprise customer" requirement inside Topic 1). Lessons-learned slide 19. |
| 18 | Topic 2: Escalation & Recovery — RCA approach, short-term remediation, exec comms, prevention plan | ✅ | 16-slide deck (`decks/topic-2-escalation.html`). Real scenario with concrete numbers ($40k/min, 87-min total). Five acts: Triage (slides 4–5), RCA framework (6–7), Stabilize (8), Comms (9–12) with **two verbatim exec emails**, Prevent (13–14). Coda (15) anchors in CSCX.AI experience. |
| 19 | 25 minutes per topic including Q&A | ✅ | Time budget per slide in `panel-notes.md` Section 1 + Section 4. Demo timed at 4 min mid-Topic-1. |
| 20 | Justify any Advanced/Bonus item skipped | ✅ | Section 0 of `panel-notes.md` carries the justification language verbatim. The license-gate framing is consistent across the deck. |

**Presentation: 4/4.**

---

## Self-assessment — out of 10

| Tier | Weight | Score | Earned |
| --- | --- | --- | --- |
| Essential (required) | 3.0 | 9/9 | **3.00** |
| Intermediate (required) | 1.5 | 2/2 | **1.50** |
| Advanced (optional, encouraged) | 2.5 | 3.5/4 | **2.19** |
| Bonus (optional, encouraged) | 0.5 | 0.5/1 | **0.25** |
| Presentation quality (decks + notes + demo) | 2.5 | 4/4 | **2.50** |
| **Total** | **10.0** | | **9.44 / 10** |

**Round to 9 / 10.** The single point of risk is the *live RGA + Passage
Retrieval* demonstration — both are license-gated, both are explained
honestly in the deck and on the live UI, and both have full integration
code shipped. The remaining ~0.5 is room for execution polish during the
panel itself (timing the demo, fielding questions cleanly).

---

## What did *not* work and what I did about it

Three things failed during the build. None of them shipped as silent bugs;
each is addressed in the deck's *Lessons Learned* slide (Topic 1 slide 19)
and in the anticipated-Q&A in `panel-notes.md` Section 3.

### 1. Coveo V2 Web Crawler silently dropped XPath extraction for `pokemonnatdex` and `pokemonimage`

Tried five XPath variants over three rebuild cycles. The crawler returned
no errors, the source built clean, but the fields stayed empty.
Consequence: the Generation facet stayed empty, since gen is derived from
natdex.

**Fix:** Switched to the Push API with PokéAPI as the canonical data
source. Wrote `scripts/push-from-pokeapi.ts` — 1,025 docs pushed in ~3
minutes, every field clean. Generation facet now shows 9 generations
summing to 1,025.

**Talking point:** *"When the connector hits a wall, switch connectors,
don't keep grinding. That's the FDE move."*

### 2. Type duplication for multi-form Pokémon (Mega Charizard returning `['Fire','Flying','Fire','Dragon','Fire','Flying']`)

Caused by the same XPath issue — the selector matched all three forms'
vitals tables.

**Fix:** Push source delivers types directly from PokéAPI's structured
JSON. Charizard now returns exactly `['Fire','Flying']`, no Mega-form
contamination.

### 3. Vercel auto-deploy webhook never installed on `aacamara/pokemon`

`gh api repos/aacamara/pokemon/hooks` returns 0. Pushes don't auto-deploy.

**Workaround:** All production deploys go through `vercel deploy --prod
--token=<token>` from the CLI. Documented in `panel-notes.md` Section 6.

**Permanent fix (deferred):** In Vercel dashboard → Project → Settings →
Git → Disconnect + Reconnect. Not blocking the panel.

---

## What's license-gated, not broken

| Feature | Trial-org status | Code state |
| --- | --- | --- |
| Relevance Generative Answering (RGA) | Sales contact required to enable | `<atomic-generated-answer />` in `SearchPage.tsx` — lights up on license upgrade |
| Passage Retrieval | Not included in trial tier | `api/passages.ts` + `<AskPokedex />` widget — returns 403 with a graceful UI message |

Both are framed honestly in the deck (slides 11, 14–15). The deck's
position: *"two advanced ML features in the architecture need a license-
tier upgrade. The integration is otherwise ready."* That's the same
conversation every Coveo customer has during a sales cycle, so flagging
it consciously is itself the FDE move.

---

## How to run / verify locally

```bash
git clone https://github.com/aacamara/coveo-pokemon.git
cd coveo-pokemon
npm install
cp .env.example .env       # fill in COVEO_ORG_ID + COVEO_API_KEY
npm run dev                # http://localhost:5173

# Re-index from PokéAPI (idempotent, ~3 min):
COVEO_PUSH_SOURCE_ID=<id> npx tsx scripts/push-from-pokeapi.ts

# Seed UA traffic for Query Suggest (after model is Active):
bash scripts/seed-ua.sh

# Build + production deploy:
npm run build
vercel deploy --prod --token=<token>
```

Smoke-test the live URL:

```bash
TOKEN=$(curl -sS -X POST https://pokemon-gold-rho.vercel.app/api/token \
        | jq -r .token)
curl -sS -X POST "https://azizfdepokemontestfhlqf1jz.org.coveo.com/rest/search/v2" \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"q":"pikachu","cq":"@source==\"pokedex-push\"","numberOfResults":1,
          "fieldsToInclude":["pokemonname","pokemontypes","pokemongeneration","pokemonimage"]}' \
     | jq '.results[0].raw'
```

Should return Pikachu with `types: ["Electric"]`, `generation: ["1"]`, image URL set.

---

## Demo script (4 minutes, mid Topic-1)

Detailed walk-through is in `decks/panel-notes.md` Section 2. Beats:

1. **Cards render with rich metadata** (45 s) — type "pikachu", point at the artwork, type pill, species line.
2. **Facets work** (45 s) — tick the **Water** type facet, result count drops to ~154.
3. **Detail page** (45 s) — click into Bulbasaur, show the hero + related-Pokémon strip.
4. **Token exchange** (45 s) — DevTools → Network → show `/api/token` mints a JWT; the API key never reaches the browser.
5. **Ask the Pokédex / Passage Retrieval** (30 s) — show the graceful 403 message; pivot to the architecture deck slides 14–15.
6. **Back to deck** (15 s).

If something goes sideways during the demo, the *"if it goes sideways"*
recovery moves are in Section 2 of `panel-notes.md`.

---

## Files of interest

```
~/coveo-pokemon-challenge/
├── HANDOFF.md                       ← this file
├── README.md                        ← project README (run instructions)
├── package.json                     ← @coveo/atomic-react, headless, react, vite
├── vercel.json                      ← serverless function routing
├── .env.example                     ← env var schema
│
├── decks/
│   ├── topic-1-architecture.html    ← 20-slide deep dive (Aziz Deck preset + Coveo accent)
│   ├── topic-2-escalation.html      ← 16-slide SEV-1 walkthrough
│   └── panel-notes.md               ← speaker notes + demo + Q&A + compliance checklist
│
├── src/
│   ├── coveo/
│   │   ├── engine.ts                ← buildSearchEngine + cq=@source=="pokedex-push"
│   │   ├── tokenClient.ts           ← caches search tokens, refreshes on 401
│   │   └── derive.ts                ← client-side artwork URL + gen-from-natdex fallback
│   ├── pages/
│   │   ├── SearchPage.tsx           ← Atomic search interface + facets + RGA hook + Ask widget
│   │   └── PokemonDetailPage.tsx    ← /pokemon/:name detail route
│   └── components/
│       ├── ResultTemplate.tsx       ← custom result card with image + type pills + gen badge
│       ├── AskPokedex.tsx           ← Passage Retrieval widget (graceful 403)
│       └── GenerationBadge.tsx
│
├── api/
│   ├── token.ts                     ← Vercel Function — mints search tokens (admin key never exposed)
│   └── passages.ts                  ← Vercel Function — proxies Passage Retrieval API
│
├── coveo/
│   ├── web-scraping-config.json     ← V2 Web Crawler scraping rules (Topic-1 slide 6)
│   ├── extension-generation.py      ← IPE: derive @pokemongeneration from natdex (kept for narrative)
│   ├── fields.json                  ← Coveo field schema seed
│   └── pipeline-statements.txt      ← Pokedex pipeline statement seeds
│
└── scripts/
    ├── seed-coveo.ts                ← one-shot: creates fields + Pokedex pipeline
    ├── push-from-pokeapi.ts         ← PokéAPI → Coveo Push API ingester (1,025 docs)
    └── seed-ua.sh                   ← Seeds UA with 33 curated queries (after QS model is Active)
```

---

## Coveo platform configuration summary

| Object | Name | Role |
| --- | --- | --- |
| Org | `azizfdepokemontestfhlqf1jz` | Trial tier; RGA and Passage Retrieval not included. |
| Pipeline | `Pokedex` | Query pipeline associated with the QS model. |
| Search hubs | `PokedexSearch`, `PokedexQA` | Main search vs Passage Retrieval surface. |
| Source — Web Crawler (full) | `pokedex-full` (1,027 docs) | Indexed pokémondb.net `/pokedex/<name>` pages. Kept for narrative. |
| Source — Web Crawler (sandbox) | `pokedex-sandbox` (1 doc) | Single Pokémon for fast scraping-config iteration. |
| Source — Push API | `pokedex-push` (1,025 docs) | PokéAPI-fed clean metadata. UI queries this. |
| Fields | 9 (`pokemonname`, `pokemontypes`, `pokemongeneration`, `pokemonimage`, …) | See `coveo/fields.json`. |
| ML Model | `Pokedex Test` (engine: `querysuggest`) | Test Configuration Mode; seeded via `scripts/seed-ua.sh`. |
| ML Model | RGA | Not provisioned — license-gated. |

API keys (rotate after the panel — all pasted in this transcript):

| Key | Privileges | Purpose |
| --- | --- | --- |
| `COVEO_API_KEY` (runtime) | Search Impersonate + Analytics Push | `/api/token` mints search tokens. |
| `COVEO_ADMIN_KEY` | Sources/Fields/Pipelines Edit, Models View | One-shot provisioning via `scripts/seed-coveo.ts`. |
| `COVEO_PUSH_KEY` | Push items to sources, Sources View all | `scripts/push-from-pokeapi.ts`. |

Vercel personal access token also in this transcript — rotate at
<https://vercel.com/account/tokens> when you're done.

---

## What to do *after* the panel

1. **Rotate every credential pasted in this transcript** (3 Coveo keys + 1 Vercel token).
2. **Decide what to do with the trial org.** It expires (typically 30–60 days). If proceeding, request the license-tier upgrade for RGA + Passage Retrieval.
3. **Fix the Vercel webhook** (5 min in dashboard) if you want auto-deploy on push.
4. **Optional: apply Coveo to CSCX.AI** — there's a draft 7-PRD plan in chat history from the earlier session (`PRD-COVEO-001..007`, multi-tenant token mint, `coveo_sync_outbox` + BullMQ outbox pattern). Regenerate by re-prompting `mellow-discovering-cocke` planning context.

---

## Open questions a fresh session might have

- *Why three Coveo sources?* — One is iteration scratch (`sandbox`), one is the brief-mandated Web Crawler over pokémondb (`full`), one is the working data path (`push`). Slide 5 of Topic 1 covers this; slide 19 codifies the lesson.
- *Where's the org ID and which API key does what?* — `.env.example` is the schema; live values are in `.env` (gitignored).
- *Where's the architecture diagram?* — `decks/topic-1-architecture.html` slide 4. ASCII art so it renders on any device.
- *What's the answer when the panel asks "why didn't you fix the crawler instead of writing Push?"* — `panel-notes.md` Section 3, the question is anticipated verbatim.

---

*This handoff was generated on Day 4 of the build. The live site, both
decks, the speaker notes, and the Coveo org state were all verified
green on this date.*
