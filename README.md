# Coveo Pokédex — Forward Deployed Engineer Challenge

This is my submission for the **Senior Director, Technical Success**
take-home challenge ("Pokémon Challenge"). It is a production-shaped Coveo
implementation that crawls [pokemondb.net](https://pokemondb.net), exposes a
search UI built with `@coveo/atomic-react`, and layers on Relevance
Generative Answering (RGA), Query Suggestions (QS), and a Passage Retrieval
"Ask the Pokédex" Q&A widget.

> **Scope:** Essential + Intermediate + Advanced + Bonus.

## Live demo

- **App:** _deployed at `https://coveo-pokemon.vercel.app` once Vercel env vars are set._
- **Repo:** _<https://github.com/aacamara/coveo-pokemon> (after `gh repo create`)_.

## What's in the box

| Tier             | Feature                                                                                | Where                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Essential        | Web crawler scoped to `/pokedex/<name>` with metadata extraction                       | `coveo/web-scraping-config.json`                                                                       |
| Essential        | `Type` and `Generation` facets, image-rich result card                                 | `src/pages/SearchPage.tsx`, `src/components/ResultTemplate.tsx`                                        |
| Essential        | Generation derived from National Pokédex No. via Indexing Pipeline Extension          | `coveo/extension-generation.py`                                                                        |
| Intermediate     | GitHub repo + Vercel deploy (search-token mint via `/api/token` Vercel Function)      | `api/token.ts`, `vercel.json`                                                                          |
| Advanced         | Relevance Generative Answering (RGA) on the search page                                | `<AtomicGeneratedAnswer />` in `SearchPage.tsx`                                                        |
| Advanced         | Query Suggestions wired into the search box                                            | `<AtomicSearchBoxQuerySuggestions />` in `SearchPage.tsx`                                              |
| Advanced         | Pokémon Detail Page with hero image, abilities, generation, related-Pokémon strip      | `src/pages/PokemonDetailPage.tsx`                                                                      |
| Bonus            | "Ask the Pokédex" — built on the **Coveo Passage Retrieval API**                       | `src/components/AskPokedex.tsx`, `api/passages.ts`                                                     |

## Architecture, in one diagram

```
                   ┌──────────────────────────┐
                   │  pokemondb.net (1,025    │
                   │  /pokedex/<name> pages)  │
                   └────────────┬─────────────┘
                                │  Coveo Web Crawler
                                │  + Web Scraping Config
                                ▼
                   ┌──────────────────────────┐
                   │  Coveo Cloud index       │
                   │  source: pokedex-full    │
                   │  pipeline: Pokedex       │
                   │  hub: PokedexSearch      │
                   └─┬─────────┬─────────────┬┘
        Indexing IPE │         │             │
   derives @gen      │         │ RGA model   │ QS model
                     ▼         ▼             ▼
                  fields    generated     query
                  facet     answers       suggestions
                                │
                                │
   ┌──────────── browser ───────┴────────────────────┐
   │  React / Atomic React                            │
   │  ┌────────────────┐  ┌───────────────────────┐   │
   │  │ SearchPage     │  │ PokemonDetailPage     │   │
   │  │  - SearchBox   │  │  - Hero image         │   │
   │  │  - Type facet  │  │  - Stats / abilities  │   │
   │  │  - Gen facet   │  │  - Related Pokémon    │   │
   │  │  - RGA answer  │  │                       │   │
   │  │  - Result list │  └───────────────────────┘   │
   │  │  - Ask the     │                              │
   │  │    Pokédex     │  /api/token   /api/passages  │
   │  └────────────────┘  (Vercel Functions, server)  │
   └──────────────────────┬───────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │  Coveo platform APIs  │
              │  /search/v2/token     │
              │  /search/v2           │
              │  /search/v3/passages  │
              └───────────────────────┘
```

## Run it locally

```bash
git clone https://github.com/aacamara/coveo-pokemon.git
cd coveo-pokemon
npm install

# Copy Atomic static assets — needed for icons + i18n
cp -r node_modules/@coveo/atomic-react/dist/assets public/assets
cp -r node_modules/@coveo/atomic-react/dist/lang   public/lang

# Provide your Coveo creds (do NOT commit this file)
cp .env.example .env
$EDITOR .env

# Run the full stack (Vite + serverless functions) via the Vercel CLI
npx vercel dev
```

The frontend boots at `http://localhost:3000`. `Vercel dev` proxies
`/api/*.ts` to local Node functions that talk to the Coveo platform with your
API key — the React app never sees the API key, only short-lived search
tokens minted by `/api/token`.

## Provision your Coveo organization

The crawler, fields, pipeline, and ML models are provisioned in the Coveo
Administration Console. Step-by-step:

1. **Fields** (Content > Fields > Add field). Use `coveo/fields.json` as a checklist.
2. **Sources** (Content > Sources > Add source > Web). Two sources:
   - `pokedex-sandbox` — start URL `https://pokemondb.net/pokedex/bulbasaur`,
     no link following. Used for fast iteration on the scraping config.
   - `pokedex-full` — start URL `https://pokemondb.net/pokedex/national`,
     **inclusion regex** `^https://pokemondb\.net/pokedex/[a-z0-9-]+$`,
     exclusions for `/move/*`, `/type/*`, `/ability/*`, `/item/*`,
     `/evolution/*`, `/stats/*`, `/sprites/*`, `/forms/*`, `/location/*`,
     `/pokedex/national`, `/pokedex/stats/*`. Paste
     `coveo/web-scraping-config.json` into **Edit with JSON**.
3. **Indexing Pipeline Extension** (Content > Extensions > Add extension).
   Paste `coveo/extension-generation.py`. Apply it to the `pokedex-full`
   source on the *Document Enrichment* phase.
4. **Field mappings** (on each Web source). Example mapping:
   `pokemonimage` ← `pokemon_image`, `pokemonname` ← `pokemon_name`,
   `pokemonnatdex` ← `pokemon_natdex`. (The IPE also writes the lower-case
   variants directly, so this is a belt-and-braces step.)
5. **Query pipeline** (Search > Query Pipelines > Add). Name it `Pokedex`.
   Paste `coveo/pipeline-statements.txt` into the *Statements* tab.
6. **Search hub.** Set `PokedexSearch` (and `PokedexQA` for the passage
   widget) as a *Search Hub Condition* on the pipeline.
7. **RGA model** (Search > Models > Add > Relevance Generative Answering).
   Filter to `@source==pokedex-full`. Associate with the `Pokedex` pipeline.
8. **Query Suggestions model** (Search > Models > Add > Query Suggestions).
   Turn on *Test configuration mode*. Associate with the `Pokedex` pipeline.

## Deploy

```bash
# Repo
gh repo create aacamara/coveo-pokemon --public --source=. --push

# Hosting
npx vercel --prod
# When prompted, set env vars on the project:
#   COVEO_ORG_ID
#   COVEO_API_KEY
#   COVEO_SEARCH_HUB=PokedexSearch
#   COVEO_PIPELINE=Pokedex
#   COVEO_QA_SEARCH_HUB=PokedexQA
```

## Why `@coveo/atomic-react` (not Headless, not plain Atomic)

- **Plain Atomic** ships fastest but blocks the React-only features the
  panel cares about (detail page, custom Passage Retrieval widget).
- **Headless on bare React** would over-rotate on UI plumbing and
  under-demonstrate Atomic, which is half the point of this challenge.
- **Atomic React** gives Atomic web components inside a real React shell —
  `<AtomicSearchBox>` and friends for the heavy lifting, plain JSX for the
  detail page and the Q&A panel. Best of both.

## Why the Web Crawler (not Push)

The challenge is "index pokemondb.net." The Web Crawler with a custom Web
Scraping Configuration is the canonical Coveo answer because:

- The selector grammar (CSS / XPath into typed metadata) is exactly what we
  need to extract Type, Generation, Image, Abilities into Coveo fields.
- The inclusion-regex filter is one line of JSON, not a custom scraper.
- Every customer who wants their docs indexed picks this path — so this
  build doubles as a teaching artifact for the Technical Success team.

## Why derive Generation in an IPE (not extract from the page)

pokemondb does not surface "Generation N" as a single DOM node. The
National Pokédex No. *is* a stable element, and generation ranges are
canonical (1–151 → I, 152–251 → II, …). Pushing that lookup table into a
Python IPE keeps the scraping config small and lets us correct the table in
30 seconds if the franchise adds a Gen X without re-crawling.

## Security: search-token exchange

The full Coveo API key has Push and Edit privileges and must not reach the
browser. `api/token.ts` exchanges that key (held in Vercel env vars) for a
short-lived search token scoped to `PokedexSearch`. The headless engine's
`renewAccessToken` callback re-mints the token transparently when it
expires. This is the FDE-correct deployment pattern and a clean conversation
opener with security teams in real customer engagements.

## Topics for the panel

- `decks/topic-1-architecture.html` — *deep-dive on what was built.*
- `decks/topic-2-escalation.html` — *Escalation & Recovery operational scenario.*

## License

This project is for interview/demo purposes only. Pokémon, Pokédex, and
related marks are © Nintendo / The Pokémon Company. Sprite imagery courtesy
of pokemondb.net. Used here under fair-use review for an interview exercise.
