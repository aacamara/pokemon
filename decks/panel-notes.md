# Panel Prep — Coveo FDE Technical Challenge

**Role:** Forward Deployed Engineer (FDE)
**Format:** 25 minutes per topic, including Q&A.
**Mode:** Quick kickoff, lead handed to you. The panel will interrupt with questions
during both topics. *You manage your own time.*

---

## 0 — Requirements compliance, cross-checked against the brief

### Pokémon Challenge — Essential (✅ all required, all done)

| Requirement | Status | Where |
| --- | --- | --- |
| Accept Coveo Cloud Org invitation | ✅ | Org `azizfdepokemontestfhlqf1jz` |
| Install Atomic or Headless locally | ✅ | `@coveo/atomic-react` 3.1.7 + `@coveo/headless` 3.4.1 |
| Index `pokemondb.net` using Cloud Platform | ✅ | Source `pokedex-full`, 1,027 indexed |
| Include only Pokémon pages (exclude Moves, Types, etc.) | ✅ | Address-pattern regex `^https://pokemondb\.net/pokedex/[a-z0-9-]+/?$` |
| Webcrawler **or** Push source | ✅ | Webcrawler (V2) — see deck slide 5–7 |
| Connect local search page to cloud endpoint | ✅ | `src/coveo/engine.ts` + `/api/token` |
| Facet by Pokémon Type | ✅ | Live, 18 types with real counts |
| Facet by Pokémon Generation | ⚠️ | Built; Coveo V2 crawler silently dropped 5 XPath variants for natdex. Strong "lessons learned" slide. |
| Display Pokémon's picture in search result | ✅ | Client-side derivation from URL slug (`img.pokemondb.net/artwork/<slug>.jpg`) — robust fallback |

### Pokémon Challenge — Intermediate (✅ all required, all done)

| Requirement | Status | Where |
| --- | --- | --- |
| Host code on GitHub | ✅ | <https://github.com/aacamara/coveo-pokemon> |
| Host search app to be accessible to panel | ✅ | <https://pokemon-gold-rho.vercel.app> |

### Pokémon Challenge — Advanced (optional, justify if skipped)

| Requirement | Status | Notes for the panel |
| --- | --- | --- |
| Deploy Coveo RGA | ⚠️ | `<atomic-generated-answer />` is wired in `SearchPage.tsx`. Model not provisioned in this sandbox — Talk track: "two clicks in Admin Console: Models → Add → RGA → filter `@source==pokedex-full` → associate with Pokedex pipeline. The component lights up the moment the model is Active." Don't pretend it's running; show the architecture. |
| Preload Query Suggest model | ⚠️ | `<atomic-search-box-query-suggestions />` wired. Same: model not provisioned, sandbox needs Test Configuration Mode + ~30 seeded queries to bootstrap. Talk through cold-start tradeoff. |
| Pokémon Detail Page | ✅ | `/pokemon/:name` route — `src/pages/PokemonDetailPage.tsx` |
| Two topics presentation | ✅ | Both decks shipped |

### Pokémon Challenge — Bonus

| Requirement | Status | Notes |
| --- | --- | --- |
| Passage Retrieval API integration | ⚠️ | Built end-to-end (`api/passages.ts`, `<AskPokedex />` widget). Feature not licensed on the sandbox tier — UI shows graceful "not enabled on this sandbox" message. Code, request payload, and a worked example are in Topic 1 deck slides 14–15. |

### How to *justify* what's incomplete (per the brief: "If you choose not to include a section, justify your choice")

> "I shipped Essential and Intermediate fully. For Advanced and Bonus, I built
> the integration code end-to-end and wired the components on the front-end —
> but I deliberately deferred the model-provisioning steps in the Coveo Admin
> Console because I thought time was better spent on the architecture story
> behind each feature than on a 30-minute model-training wait. That story is
> what I'd be selling at customer scale anyway. The two-click admin
> provisioning is itself a slide."

---

## 1 — Topic 1: Architecture Deep Dive (25 min)

### Time budget

| Block | Minutes |
| --- | --- |
| Slide 1 (Cover) + intro | 1 |
| Slides 2–4 (Brief, Decisions, Architecture diagram) | 3 |
| Slides 5–7 (Indexing) | 4 |
| **Live demo** | 4 |
| Slides 8–10 (UI + token security) | 3 |
| Slides 11–13 (ML & RGA) | 2 |
| Slides 14–15 (Passage Retrieval / Bonus) | 2 |
| Slides 16–18 (CSCX.AI as the enterprise anchor) | 3 |
| Slide 19 (Lessons learned) | 1 |
| Q&A buffer | 2 |
| **Total** | **25** |

The demo slot is mid-deck, *after* I've defended the architecture but *before*
ML/RGA — that way the panel sees the bones working, then we layer ML on top
in slides.

### Speaking notes per slide

#### Slide 1 — Cover
> "Thank you. I built a Coveo deployment around `pokemondb.net`, end-to-end —
> crawler, fields, pipeline, ML hooks, search UI, hosting, and the security
> exchange between the browser and the platform. I shipped Essential through
> Bonus, with two ML models deferred to Admin Console clicks I'll explain.
> Twenty-five minutes; I'll demo at minute eight; please interrupt at any
> point — I'd rather answer your real question than my prepared one."

#### Slide 2 — The brief
> "Index pokemondb.net, only Pokémon pages, with Type and Generation facets,
> images on cards. Atomic or Headless. Optional: RGA, Query Suggest, detail
> page, Passage Retrieval. I shipped all four tiers of the build."

#### Slide 3 — Six forks in the road
> Walk down the table. *Don't* read it — defend each in one sentence.
> - "Atomic React because plain Atomic blocks the detail page route, and
>   Headless on bare React under-uses Atomic — which is half the point."
> - "Web Crawler because the brief is 'index a site,' and that's exactly
>   the muscle every customer asks an FDE to teach them."
> - "IPE for generation because pokémondb has no `Generation N` DOM node —
>   the National No. ranges are canonical and I keep them in code I can
>   diff, not a CSS selector that breaks the next time their design ships."
> - "Token mint because the API key never reaches the browser. Period."

#### Slide 4 — Architecture diagram
> "One slide so the panel and I share the same map. Five surfaces: source,
> pipeline, ML models, the React/Atomic shell, the two Vercel functions.
> Everything else is wiring."

#### Slide 5 — Indexing · URL strategy
> "Two sources on purpose. `pokedex-sandbox` is one Pokémon — bulbasaur —
> with no link follow. It lets me iterate on the scraping config in 10
> seconds instead of waiting 17 minutes for a 1,025-page recrawl. That
> sandbox saved me about three hours over the course of this build, and
> it's exactly the workflow I'd hand to a new FDE on day one."
>
> "The inclusion regex is one line. Address patterns block the listing
> page from being indexed but allow it for traversal. Combined with the
> URL filter, we go from ~4,800 docs (the entire pokémondb domain) to
> exactly 1,027 — the 1,025 Pokémon plus two listing variants."

#### Slide 6 — Web Scraping Configuration
> "The full JSON. Stable XPath selectors — `//th[text()='Height']/...`
> — over fragile class names. The day pokémondb redesigns their CSS, my
> selector still works because semantically there is still a row whose
> header is 'Height'."
>
> "I'm dedicated about saying I went through five iterations on this
> config. The Coveo V2 crawler silently rejects some XPath patterns —
> `@src` attribute selection, `tbody` tree paths, certain Unicode-text
> matches — without telling you. The lessons-learned slide owns this."

#### Slide 7 — Generation IPE
> "Generation isn't a DOM node. National No. is. Generation ranges are
> known: Gen 1 is 1–151, Gen 2 is 152–251, etc. Twenty-eight lines of
> Python in an Indexing Pipeline Extension. The mapping table lives in
> code I can `git diff`. When Gen 10 ships, I add one row and re-run
> the IPE — no recrawl."
>
> *Honesty: in this org the natdex extraction itself is currently
> failing because of the V2-crawler XPath issue. The IPE is still
> the right pattern; the unblock is one Coveo Support call. Don't
> over-explain — own it on the lessons slide.*

#### Demo (4 minutes — see "Demo script" section below)

#### Slide 8 — Atomic React composition
> "Atomic web components for the heavy plumbing — the search box's instant
> results, the facets, the result list. Plain JSX where I need it — the
> detail page, the Q&A widget. The `template` prop on `AtomicResultList`
> takes a JSX-returning function, which is the bridge between the two
> worlds. That's why I picked Atomic React over plain Atomic: I get this
> bridge for free."

#### Slide 9 — Result template
> "Image on the left, name and natdex top-right, type pills below, species
> at the bottom. Color-coded type pills are a small thing but matter for
> retail-search demos — Coveo's customers expect the brand-correct chip
> styling out of the box."

#### Slide 10 — Token exchange
> "This is where security teams want to start the conversation. The full
> Coveo API key has Push and Edit privileges. It must not be in the bundle.
> `/api/token` is a Vercel Function that holds the key in env vars and
> exchanges it for a search token scoped to the `PokedexSearch` search hub.
> The headless engine's `renewAccessToken` callback re-mints transparently
> on 401."
>
> "I run two separate keys — admin key for provisioning (fields, pipelines,
> sources) and a runtime key with only `Search > Impersonate` and
> `Analytics > Push`, generated from Coveo's 'Authenticated search' template.
> One credential, one job. That's the FDE-correct deployment pattern and a
> good opener with a customer's CISO."

#### Slide 11 — RGA
> "Three clicks: add the model, filter to `@source==pokedex-full`, associate
> with the Pokedex pipeline. The `<atomic-generated-answer>` element in my
> markup lights up the moment the model is Active. The hard part of RGA is
> never the component — it's *which content* the model is allowed to ground
> on. The filter is the FDE control surface. That's the thing customers
> always under-think."

#### Slide 12 — Query Suggest
> "QS trains on Coveo Usage Analytics. ~10,000 queries for great quality.
> Sandbox path: Test Configuration Mode plus ~30 seeded queries to bootstrap.
> Production path: connect search hubs early, accept that the first 30 days
> the suggestions are mediocre, then watch ART (Auto-Relevance Tuning)
> compound against the same pipeline."
>
> "Naming the cold-start tradeoff in the deck — instead of pretending it's
> fully populated — is the FDE move. I'd rather a customer hear 'this gets
> better in 30 days' from me on day zero than from their own VP on day 31."

#### Slide 13 — Pipeline statements
> "Two surfaces a Technical Success team has to teach customers: pipeline
> statements and ML models. They're complementary. Statements are explicit
> business policy — `if user types 'pikachu', pin Pikachu`. Models are
> observed behavior. I'd never tell a customer 'just use ML.' I'd teach
> them to spend 30 minutes on featured queries and thesaurus seeds first,
> then let ART claim the rest."

#### Slide 14 — Passage Retrieval bonus
> "Question: 'Which Gen 1 Pokémon has the highest Special Attack?' The Type
> facet can't answer that. Even RGA on the result set is awkward. The
> Passage Retrieval API answers it directly because it ranks *passages*,
> not documents — Mewtwo's stats row floats above all others on relevance."

#### Slide 15 — Why Passage Retrieval matters
> "This isn't a feature; it's the substrate. Coveo for Agentforce calls
> this endpoint. The Atlas knowledge layer calls this endpoint. Every
> agentic feature a customer wants to build over the next 18 months —
> copilots, action recommenders, deflection bots — calls `/v3/passages/retrieve`,
> not `/search/v2`. The FDE leverage is to teach customers *this* endpoint
> early, so when they have an LLM ambition they don't bypass Coveo for
> a vector store."
>
> *Honesty: this sandbox doesn't have Passage Retrieval licensed. I
> shipped the integration anyway because the architecture is the
> teach. The UI shows a graceful "feature not licensed in this sandbox"
> message instead of an error.*

#### Slide 16 — CSCX.AI: I'm the enterprise customer
> "The Pokémon Challenge advanced section asked me to identify an
> enterprise customer who could benefit from a similar Coveo solution.
> I picked the one whose roadmap I control. CSCX.AI is the AI-native
> Customer Success platform I've been building. Pre-revenue, multi-tenant,
> Supabase + GCP Cloud Run, 118 routes in production today."

#### Slide 17 — The mapping table
> "Walk down the table line by line — Pokémon → CSM-domain mappings.
> The point is *every primitive maps cleanly*. Web Crawler → Push API on
> playbooks and ticket archives. Type/Generation facets → Industry/ARR
> band/Lifecycle stage/Churn risk. RGA → 'what should I do for this
> account?' Passage Retrieval → CSCX.AI's CADG agent."

#### Slide 18 — The commercial story
> "A Coveo-powered CSCX.AI sells at $30K+ ACV — Gainsight-class price
> points — instead of the $12K floor I'm anchoring at today. CSCX.AI's
> ICP is exactly Coveo's *next* ICP: VC-backed SaaS, 50–200 FTE,
> AI-native expectations, support volume but no Salesforce-tier budget.
> I'd carry that into the role: an FDE who has personally
> deployed Coveo at his own SaaS and can coach AEs through the same
> conversation in front of customers."

#### Slide 19 — Lessons learned
> "Three things I'd do with another week."
>
> 1. *Push, not Crawler, for the live half.* The Crawler is right for
>    static stats. Push would let me index live data — Smogon competitive
>    tiers, Pokémon GO availability — without re-crawling.
> 2. *Streamed RGA citations.* The current component is great as a
>    black box. Streaming the citation events into a custom React
>    component would let me demo "watch the model decide what to ground
>    on," which is the conversation customers actually want.
> 3. *Properly seeded UA.* I'd run a synthetic-user script for a week
>    and graph the QS model's Active → trained → relevant transition.
>    Better demo, better honesty about ML cold-start.
>
> 4. *(Bonus, if asked)* Diagnose the V2 crawler's XPath quirk on natdex
>    extraction. I tried five selector variants — including position-based,
>    `contains()`, attribute selectors — and all silently returned empty.
>    A 30-minute call with Coveo Support would unblock it. The fact that
>    I'm shipping this without it, and naming it, is itself the FDE move.

#### Slide 20 — Close
> "Demo's done; questions are next. I'd rather you break the live app
> in real time than I keep talking. What's first?"

---

## 2 — Live Demo Script (4 minutes, mid-deck)

**URL:** <https://pokemon-gold-rho.vercel.app>

Open this in a browser tab *before* the call starts. Keep DevTools → Network
panel open in a second tab — you'll show it during the security beat.

### Beat 1 — "Cards render with rich metadata" (45 sec)

1. Refresh the homepage. Pause at the "Loading Coveo engine…" message for
   half a second so the panel sees the engine bootstrap.
2. Type **"pikachu"** in the search box. Hit Enter.
3. Talk to what shows up:
   > "One result — Pikachu. Card has the artwork, the natdex link to the
   > original page, an Electric type pill, and 'Mouse Pokémon' as the
   > species line. Every value here came out of `pokemondb.net`'s HTML
   > and through the scraping config I just walked through."

### Beat 2 — "Facets work" (45 sec)

1. Clear the search. The full 1,025 results appear.
2. Click the **Type** facet → tick **Water**. Result count drops to ~159.
3. Talk:
   > "Type facet, real Coveo facet, real counts. Notice it's color-coded
   > by Pokémon canon — Water blue, Grass green. That's a 30-line CSS
   > palette in the result template, not a Coveo-platform thing. The
   > teaching beat: customers always over-engineer this layer; Atomic
   > result templates are pure CSS."

### Beat 3 — "Detail page" (45 sec)

1. Untick Water. Click into **Bulbasaur**'s card.
2. Show the detail page: hero artwork, types, abilities, related-Pokémon strip.
3. Talk:
   > "Detail page is a real React route — `/pokemon/bulbasaur`. The
   > 'Related Pokémon' strip below is its own search call: same engine,
   > same pipeline, constrained to other Grass-type Gen 1 Pokémon. This
   > is where the React shell earns its keep."

### Beat 4 — "Token exchange" (45 sec)

1. Switch to the DevTools Network tab.
2. Reload the page. Filter requests to `coveo`.
3. Show:
   - `POST /api/token` → returns a 455-character JWT (no API key visible).
   - `POST /search/v2` calls use `Authorization: Bearer <that-JWT>`.
4. Talk:
   > "API key never touches the browser. The Vercel Function holds it
   > and mints a search token scoped to PokedexSearch. The headless
   > engine renews on 401. CISO will love this."

### Beat 5 — "Ask the Pokédex / Passage Retrieval" (30 sec)

1. Scroll to the **Ask the Pokédex** widget.
2. Click the sample chip: *"Which Gen 1 Pokémon has the highest Special Attack?"*
3. The UI shows the graceful "Passage Retrieval not enabled on this sandbox"
   message.
4. Talk:
   > "The integration is shipped — code, payload, fallback messaging.
   > The feature isn't licensed on this trial tier. The architecture
   > slide is up next; I'll show the request payload and what the
   > production response looks like."

### Beat 6 — "Back to deck" (15 sec)

> "That's the live system. Back to slides."

### If the demo goes sideways

- **Token endpoint 401:** likely Vercel env var got rotated. Recover with
  *"in production we'd page on this; for the demo I'll show the local dev
  loop"* — open the README or the engine.ts file and walk it instead.
- **Search returns 0 results:** show the Coveo Admin Console source state
  in another tab; pivot to "this is exactly the kind of incident Topic 2
  is about, let me preview that thinking…"
- **Vercel auth wall reappears:** mention the SSO toggle is the panel-
  blocker, paste the URL into a fresh window. (Tested: it's off as of
  ship time.)

---

## 3 — Topic 1 anticipated Q&A

**Q: Why Atomic React over Headless?**
> "Atomic React gives me Atomic web components for the parts where I want
> Coveo's house style — the search box, the facet UI, the generated
> answer — and a real React shell for the parts where I want full
> control: the detail page, the Q&A widget, the token-exchange wiring.
> Headless on bare React would be more code for components Atomic gives
> me for free. Plain Atomic would block the React-only routes."

**Q: Why Web Crawler over Push API?**
> "The challenge is 'index a site.' That's exactly Web Crawler's job and
> exactly the muscle FDEs teach customers. The trade-off: I lose the
> ability to push live data — Smogon competitive tiers, Pokémon GO
> availability. With another week I'd run both connectors side by side."

**Q: How do you handle the cold-start on Query Suggest?**
> "Test Configuration Mode plus ~30 seeded queries via the search API to
> bootstrap UA. In production, I'd connect search hubs early and accept
> that day-one suggestions are mediocre. I'd front-load the conversation:
> 'this gets meaningfully better at day 30.' I'd never let a customer be
> surprised by it."

**Q: What's your test strategy?**
> "Right now: TypeScript builds clean, Vite bundle ships at 250 KB
> gzipped, and the seed script is idempotent. With another week I'd
> add a Playwright smoke test that walks the four demo beats — token
> mint, facet click, detail page nav, Passage Retrieval graceful
> fallback — and run it as a Vercel checks step on every PR."

**Q: Why isn't the Generation facet populated?**
> "Coveo's V2 crawler silently rejected five XPath variants I tried for
> the National No. extraction — including position-based, `contains()`,
> attribute selectors. The pattern of failures suggests their XPath
> engine has constraints undocumented in the public docs. I'd open a
> Support ticket on day one of the role. The architecture is unchanged —
> generation is still derived in the IPE; the IPE just doesn't fire
> because its input field is empty."

**Q: Mega Charizard returns six types instead of two — why?**
> "Pokémondb pages have multiple vitals tables for forms. My selector
> matches all of them. I dedupe client-side in the result template.
> Production fix: scope the XPath to the first form's table only —
> 30-second change, requires a recrawl. I made the call: ship now,
> diagnose the harder XPath gap first."

**Q: How does this scale to a real customer's site?**
> "Three changes. (1) Push, not Crawler, for the dynamic surface area.
> (2) Source partitioning by content type — one source per CMS — so
> ML models train per content domain. (3) Per-search-hub error
> budgets. Topic 2 covers the operational side."

**Q: How do you handle multi-language?**
> "Coveo's `localization` parameter at engine config + per-document
> language fields. The harder thing is RGA: by default the model
> serves English-only. Customer-side, I'd pre-create separate pipelines
> per locale and route at the search-hub level. I'd never try to make
> one model do five languages."

**Q: How would you measure this in production?**
> "Three numbers. Search availability (SLO 99.9%). Click-through rate
> on top-3 results (the only relevance metric customers can verify
> for themselves). Time-to-first-byte at the edge (the only latency
> metric that correlates with conversion). I'd build the dashboard
> *before* the customer asks for one."

**Q: Why not use Coveo's hosted search page editor?**
> "Two reasons. The hosted page can't add a custom Passage Retrieval
> widget — it's locked to standard Atomic primitives. And the hosted
> page can't ship a serverless `/api/token` proxy, so the API key
> would be exposed. The hosted editor is right for an MVP demo;
> it's wrong for the production architecture I'm proposing."

**Q: What were your biggest mistakes during the build?**
> "Three. (1) I lost 90 minutes initially trying to PUT the
> WebScrapingConfiguration via the Source API; the canonical path is
> the Web Scraping subtab in Admin. Lesson: API doesn't always equal
> primary. (2) I had a sequencing bug where my own subsequent PUT call
> overwrote the user's UI paste. Lesson: read-modify-write needs a
> fresh GET every time. (3) I burned a rebuild on a stale field-mapping
> name. Lesson: Coveo field names are case-sensitive *and* underscore-
> sensitive. The mapping `pokemon_name → pokemonname` is not the same
> as `pokemonname → pokemonname`."

---

## 4 — Topic 2: Escalation & Recovery (25 min)

### Time budget

| Block | Minutes |
| --- | --- |
| Slide 1 (Cover) + frame | 1 |
| Slide 2 (Scenario) | 1 |
| Slide 3 (Five-act frame) | 1 |
| Slides 4–5 (Triage + first-30-min timeline) | 4 |
| Slides 6–7 (RCA framework + telemetry) | 4 |
| Slide 8 (Stabilize / remediation table) | 3 |
| Slides 9–12 (Comms — exec emails) | 4 |
| Slides 13–14 (Prevention) | 4 |
| Slide 15 (Coda) + Q&A | 3 |
| **Total** | **25** |

### Speaking notes per slide

#### Slide 1 — Cover
> "I'll run this as if I'm in the room. The setup is a real-shaped
> SEV-1 — top-decile commerce account, peak traffic, money on the
> line. The brief asked for four things: RCA approach, short-term
> remediation, executive communications, and a recurrence plan.
> I'll walk all four, but I'll do it inside a five-act structure
> I use because incidents only stay coherent when someone names
> the structure first."

#### Slide 2 — Scenario
> "Acme Co. — top-decile commerce account, ~$1.2M ARR. Black Friday.
> 5xx rate at 14% during peak minutes. p95 at 4.2 seconds vs. our
> 250ms SLO. Estimated revenue impact at the customer is $40K/min
> in lost cart conversion. Their CEO has emailed our CRO. We are 12
> hours from doors-open in EU."
>
> "The numbers are specific on purpose. SEV-1 conversations get
> hand-wavy fast; concrete numbers anchor the room."

#### Slide 3 — Five-act frame
> "Triage — stop the bleed. RCA — find the cause. Stabilize — get
> degraded-but-stable. Communicate — keep trust. Prevent — make sure
> it doesn't happen again. Each act has one job, one deliverable,
> one clock."

#### Slide 4 — Triage
> "First 15 minutes. Severity is set, not negotiated. Top-decile
> account plus 5xx > 5% for > 5 min equals SEV-1. The on-call FDE
> declares it. One war room, one bridge. I'm the IC. Roles named
> on the first message: scribe, customer liaison, exec liaison,
> technical lead. Anyone unnamed is a witness, not a participant —
> that line keeps the room small enough to think."
>
> "The three-question sweep is the most under-rated tool in
> incident response. Have we shipped anything in 24 hours? Has the
> customer? Did a model retrain? Three yes/no answers narrow the
> hypothesis tree in seconds."

#### Slide 5 — First 30 minutes timeline
> "I scripted the actual 30 minutes because I want the panel to see
> a clock running. Page at 21:47. War room at 21:49. Customer Slack
> acknowledged at 21:51. *First exec update at 21:53* — I cannot
> overstate this — the longest dangerous gap in any SEV-1 is between
> the page firing and the first 'we know, we're on it' going up the
> chain. Five minutes."
>
> "Three-question sweep at 22:02 catches both yeses. Mitigation
> in flight at 22:08, recovery confirmed at 22:14. *Stabilization,
> not resolution.* The RCA continued for hours after the storefront
> was healthy."

#### Slide 6 — Hypothesis tree
> "I refuse to investigate widely during a SEV-1. I run a tree the
> team has rehearsed. Capacity, data, config, dependency. For each
> branch, one telemetry pane and one repro recipe live in the
> runbook. The branch-close criteria are pre-written. If the team
> hasn't rehearsed the tree, they're inventing it during the
> incident — and that is when bad calls happen."

#### Slide 7 — Telemetry stack
> "Two halves. Coveo-side: search analytics, source health, model
> status, API latency. Customer-side: RUM, edge logs, app logs,
> business KPI. The non-negotiable: telemetry must be joinable on a
> request ID end-to-end. If it isn't, that's a P1 follow-up
> regardless of the actual root cause. RCA on hearsay is not RCA."

#### Slide 8 — Remediation table
> "Reach for the most reversible move first, *always*. The table is
> ranked by reversibility, not power. Pin pipeline to last-known-good
> is instant and invisible. ML rollback is instant and slightly
> noticeable. Query throttling is manual and customer-impacting.
> Failover and cut-over are last."
>
> "The teaching: many junior IC's reach for the biggest hammer
> because it feels decisive. The senior move is the smallest hammer
> that stops the bleed."

#### Slide 9 — Comms framing
> "Comms is a feature, not an afterthought. Customer's confidence
> in us during SEV-1 is itself a service that needs an SLO. Cadence
> ladder is set in writing in message #1: 15 min for the technical
> lead, 30 min for the CTO, 60 min for the CEO."
>
> "What we say to the CEO is not what we say to the CTO. The CEO
> needs to know I'm an adult. The CTO needs to know I'm right."

#### Slide 10 — Update #1 to the customer CEO
> "I wrote it long-form because every word matters when an exec is
> reading at 21:53. SIAN — Situation, Impact, Action, Next-update.
> Specific numbers, named actor, named time. No 'committed to
> excellence' — that phrase is a red flag for the recipient because
> it correlates with vendors who are not actually committed to
> excellence."

#### Slide 11 — Close-out email
> "After resolution. 87 minutes total impact. The cause section
> names a specific interaction — a $qre boost they pushed plus a
> retrain we ran at the wrong moment. Neither alone caused the
> incident; the interaction did. That distinction matters because
> the recurrence plan has to address the *interaction*, not just
> 'don't push $qre boosts.'"
>
> "The recurrence section has four bullets. ML retrain freeze.
> Synthetic load test. Joint runbook. 60-day post-incident review
> with shared OKRs."

#### Slide 12 — Internal comms
> "Two audiences. To execs: SEV, customer impact, what I've done,
> what I need them to do — usually 'don't call this customer right
> now.' To the team: append-only Slack thread, time-stamped, one
> channel for IC commands, another for chatter. Don't mix."

#### Slide 13 — Customer-side prevention
> "Joint capacity model. Pre-event runbook. Joint GameDay twice a
> year. Shared OKRs. The blockquote is the soundbite: 'we don't sell
> uptime, we sell trust. Uptime is just one of trust's downstream
> effects.' If I get only one slide remembered, this is it."

#### Slide 14 — Coveo-side systemic prevention
> "Five things. Error budgets per search hub that *enforce* the
> budget — burn it and the platform refuses to retrain ML. Pipeline
> revision pinning as a first-class API. FDE-on-call rotation —
> not just engineering. Runbook library as code. CSM in the war
> room from minute one — that's the muscle most vendors miss."

#### Slide 15 — Coda
> "I'm not theorizing. I run CSCX.AI — multi-tenant, GCP, real
> customers, real SEV-2s with my name on them. The cadence ladder,
> the SIAN format, the 'what we say to the CEO' template — I built
> them for myself first. I trust them because they've kept me sane.
> I've also been the founder reading the vendor's 'we are committed
> to excellence' email at 3 AM, so I know what trust feels like
> from both sides of the war room."
>
> "Last line: 'a Forward Deployed Engineer is in the room
> *before* the page fires, not after.' That's how I'd run this
> function."

#### Slide 16 — Close
> "Throw me an incident. Let's run a room together for ten minutes.
> What's the scenario?"

### Topic 2 anticipated Q&A

**Q: How do you decide who's IC during a SEV-1?**
> "The on-call FDE declares the SEV. The on-call IC is named in the
> rotation, not chosen during the incident. The IC role is structural —
> rotates on a published schedule — so when the page fires, no one
> is wondering who runs the room. If the IC is unavailable, the
> backup IC is also pre-named. I would never have an incident where
> the first 5 minutes are spent figuring out who's leading."

**Q: What if a customer pushes a bad config that causes the SEV-1?**
> "Three things, in order. (1) I fix the symptom on our side first —
> pin the pipeline, mitigate. The customer's outage is mine to fix
> regardless of source. (2) I write the postmortem with the customer
> as a partner, not as the cause — the postmortem says 'a configuration
> change interacted with our retrain cadence,' not 'the customer
> broke it.' (3) Then we fix the *system* so the same change can't
> cause an outage again — pre-flight validation, ML retrain freeze
> windows, pipeline revision pinning as a first-class API. Customer
> blame fixes nothing; system fixes prevent the next one."

**Q: What's the longest you'd let a SEV-1 run before paging the CEO?**
> "Zero seconds. Our CEO is on the first exec update at minute 5,
> CC'd. Their CEO is paged within 30 minutes if the impact is
> revenue-class. The longest dangerous gap in any SEV-1 is between
> the page firing and the executive layer knowing — that gap is
> what causes 'why didn't anyone tell me' postmortems. I close that
> gap with a default, not a judgment call."

**Q: How do you balance speed of mitigation against finding root cause?**
> "Stabilization is the only goal in the first hour. RCA can wait
> hours; revenue cannot wait minutes. Pin to last-known-good even
> if you don't yet know which line of the new pipeline broke things
> — you can diagnose later, while the customer is healthy. The mistake
> juniors make is they want to debug *before* mitigating. Wrong order."

**Q: How do you handle a customer who refuses to follow your remediation advice?**
> "Document the recommendation in writing, time-stamped, with the
> business risk made explicit. Then follow their direction *and*
> escalate within Coveo at the AE/CSM level so the relationship
> gets the attention it needs. The customer is allowed to make their
> own choice; I'm responsible for making sure they make an informed
> one. If the choice has SLA implications, that's a contract
> conversation, not a SEV-1 conversation."

**Q: What metrics define 'recovered' for you?**
> "Three. (1) Customer-facing 5xx below 1% sustained for 15 minutes.
> (2) p95 latency back inside the SLO. (3) The customer's *own*
> business KPI — cart-creation in this case — back to baseline. The
> third one is the only one that actually proves recovery; the first
> two can pass while the customer is still bleeding."

**Q: What's the role of the CSM during a SEV-1?**
> "Two things. (1) Customer-facing translation: they speak the
> customer's stakeholder map, they know the political layer, they
> own the relationship. They translate my technical updates into
> what the customer's CMO actually needs to hear. (2) Trust ledger
> keeper: they track the post-incident commitments and own the 60-day
> review. The CSM in the war room from minute one is the FDE-CSM
> partnership working. Most vendors put the CSM in afterward; that's
> too late."

**Q: How big should the war room be?**
> "Five named roles, plus on-call escalation paths. IC, scribe,
> customer liaison, exec liaison, technical lead. Anyone else who
> joins is a witness — they listen, they don't talk in the IC channel.
> Bigger rooms make worse decisions. There's a Slack-thread audit
> trail in another channel for everyone else who wants to learn."

**Q: How do you handle a SEV-1 that turns out to be a false alarm?**
> "Stand the war room down with the same ceremony you stood it up
> with. 'Acme search 5xx investigation closed at HH:MM, no customer
> impact, root cause: alert threshold triggered by traffic burst that
> did not actually breach SLO.' Specific. Then *look at the alert
> thresholds* — false alarms erode the team's ability to react to
> real ones, so the prevention work is on the alerting side, not
> the platform side."

**Q: What if engineering tells you they need 4 hours to RCA but the
   customer wants an answer in 1?**
> "Two clocks. Tell engineering: 'we'll buy you four hours by
> mitigating now; communicate the mitigation to the customer; you
> RCA on the long clock.' That's the central FDE move — protect
> engineering's RCA time *by* paying for it with comms. Customers
> don't actually want an instant root cause; they want to know
> someone is on it and they aren't bleeding. Buy time with comms,
> spend it on RCA."

**Q: How does the prevention plan get funded?**
> "I'd carry the proposal to the customer's CTO with a number on it.
> 'Here's an 87-minute incident at $40K/min — that's $3.5M of
> exposed revenue this quarter. The prevention plan costs us X hours
> of engineering and Y hours of yours over 60 days. Even at 10%
> probability of recurrence, the math closes itself.' Customers
> fund prevention when prevention is framed as preventing a number
> they've already seen, not as a generic best-practice."

---

## 5 — Cross-cutting things to remember on the call

- **Open with a metric.** First 30 seconds: "I shipped Essential through
  Bonus." Don't soft-open.
- **Demo at minute 8 of Topic 1.** Mid-deck, after architecture, before ML.
- **Manage your own clock.** The brief explicitly says they hand the lead
  to you — they're testing whether you can keep 25 minutes tight. Wear a
  watch or have a timer visible.
- **Welcome interruptions.** They will jump in. *Answer the actual
  question*, then pivot back to the deck — don't double-down on your
  prepared script if they've moved past it.
- **Own the gaps explicitly.** Generation facet, RGA model, QS model,
  Passage Retrieval license — say what's not done and *why I made the call*.
  The brief literally says "if you choose not to include a section,
  justify your choice." Take the brief at its word.
- **Don't say "we" about Coveo.** You're auditioning, not staff yet. Say
  "Coveo" or "the platform." Saying "we" too early reads as presumptuous;
  saying "you" when discussing the product reads weirdly distant. Just
  say "Coveo."
- **Always pivot back to customer impact.** Every architecture decision
  → "what does this mean for the customer." Every Topic 2 act → "what
  does the customer experience." That's the FDE-leadership voice.
- **For Topic 2, the panel may want to "play customer."** They might
  throw a curveball — "we already pinned the pipeline and it didn't
  recover" — be ready to escalate the hypothesis tree to the next
  branch. Stay calm; the panel is testing your composure, not your
  trivia.

---

## 6 — Logistics checklist (day-of)

- [ ] Open <https://pokemon-gold-rho.vercel.app> in a clean browser window 5 min before call
- [ ] DevTools → Network panel open in a second tab, filter set to `coveo`
- [ ] Topic 1 deck open in tab 3: `decks/topic-1-architecture.html`
- [ ] Topic 2 deck open in tab 4: `decks/topic-2-escalation.html`
- [ ] GitHub repo open in tab 5 for the "show the source" beat: <https://github.com/aacamara/coveo-pokemon>
- [ ] Coveo Admin Console open in tab 6 for the "this is what the source looks like" beat
- [ ] Camera at eye level, sit straight, water within reach
- [ ] Mute notifications (Slack, Mail, Calendar)
- [ ] Phone face-down, on silent
- [ ] Have a printout of *this notes file* on paper — if Wi-Fi flakes, your
      notes still work

---

*End of panel notes.*
