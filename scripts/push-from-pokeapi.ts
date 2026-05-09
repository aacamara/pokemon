/**
 * Idempotent batch ingester: PokéAPI → Coveo Push API.
 *
 *   COVEO_ORG_ID=…  COVEO_ADMIN_KEY=…  COVEO_PUSH_SOURCE_ID=…  npx tsx scripts/push-from-pokeapi.ts
 *
 * Why this script exists:
 *   The Web Crawler source (`pokedex-full`) silently dropped XPath extraction
 *   for natdex and image — five selector iterations failed on the V2 crawler.
 *   PokéAPI returns the same data as clean JSON, no scraping required. This
 *   script lights up the broken fields by switching connector type entirely.
 *
 * What it does:
 *   1. Pages PokéAPI for all Pokémon (limit 1025).
 *   2. For each Pokémon, fetches /pokemon/{id} + /pokemon-species/{id}.
 *   3. Transforms to a Coveo Push doc with the same field names the React
 *      result template already reads (pokemonname, pokemontypes, etc.).
 *   4. Posts in batches of 50 to the Push API.
 *
 * Idempotency: documentId = `https://pokeapi.co/api/v2/pokemon/<id>`.
 * Re-runnable: each PUT replaces the prior doc.
 */

const ORG = process.env.COVEO_ORG_ID;
const KEY = process.env.COVEO_PUSH_KEY ?? process.env.COVEO_ADMIN_KEY;
const SOURCE_ID = process.env.COVEO_PUSH_SOURCE_ID;

if (!ORG || !KEY || !SOURCE_ID) {
  console.error('Set COVEO_ORG_ID, COVEO_PUSH_KEY, COVEO_PUSH_SOURCE_ID.');
  process.exit(1);
}

const PLATFORM = `https://api.cloud.coveo.com/push/v1/organizations/${ORG}/sources/${SOURCE_ID}`;
const POKEAPI = 'https://pokeapi.co/api/v2';
const TARGET_COUNT = 1025;
const BATCH_SIZE = 50;

const GEN_MAP: Record<string, number> = {
  'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3,
  'generation-iv': 4, 'generation-v': 5, 'generation-vi': 6,
  'generation-vii': 7, 'generation-viii': 8, 'generation-ix': 9,
};

type PokemonDoc = {
  documentId: string;
  title: string;
  data: string;
  fileExtension: '.html';
  pokemonname: string;
  pokemonnatdex: number;
  pokemontypes: string[];
  pokemonimage: string | null;
  pokemonabilities: string[];
  pokemonheight: string;
  pokemonweight: string;
  pokemonspecies: string | null;
  pokemongeneration: string | null;
  permanentid: string;
  clickableuri: string;
};

function titleCase(s: string): string {
  return s.replace(/(^|-)([a-z])/g, (_, sep, c) => (sep === '-' ? '-' : '') + c.toUpperCase());
}

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json() as Promise<T>;
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
        continue;
      }
      throw new Error(`${r.status} ${r.statusText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  throw new Error('unreachable');
}

async function buildDoc(id: number): Promise<PokemonDoc | null> {
  type PokemonResp = {
    name: string;
    height: number;
    weight: number;
    types: { type: { name: string } }[];
    abilities: { ability: { name: string }; is_hidden: boolean }[];
    sprites: { other: { ['official-artwork']: { front_default: string | null } } };
  };
  type SpeciesResp = {
    generation: { name: string };
    genera: { genus: string; language: { name: string } }[];
  };

  let pokemon: PokemonResp;
  let species: SpeciesResp;
  try {
    [pokemon, species] = await Promise.all([
      fetchJson<PokemonResp>(`${POKEAPI}/pokemon/${id}`),
      fetchJson<SpeciesResp>(`${POKEAPI}/pokemon-species/${id}`),
    ]);
  } catch (err) {
    console.warn(`  ✗ skip #${id}: ${err}`);
    return null;
  }

  const name = titleCase(pokemon.name);
  const types = pokemon.types.map((t) => titleCase(t.type.name));
  const abilities = pokemon.abilities.map((a) => titleCase(a.ability.name));
  const heightM = (pokemon.height / 10).toFixed(1);
  const weightKg = (pokemon.weight / 10).toFixed(1);
  const heightFt = pokemon.height * 0.32808; // dm → ft
  const heightFtWhole = Math.floor(heightFt);
  const heightInches = Math.round((heightFt - heightFtWhole) * 12);
  const weightLbs = (pokemon.weight * 0.220462).toFixed(1);
  const genus = species.genera.find((g) => g.language.name === 'en')?.genus ?? null;
  // Stored as string because Coveo STRING multiValueFacet is the simplest
  // facet config; the UI reads it back via Number() when it needs an int.
  const genInt = GEN_MAP[species.generation.name] ?? null;
  const generation = genInt != null ? String(genInt) : null;
  const documentId = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const image = pokemon.sprites.other['official-artwork'].front_default ?? null;

  // Coveo Push API requires `data` field with the indexable body.
  const data = `<html><head><title>${name} — Pokédex</title></head>
<body>
<h1>${name}</h1>
<p>National №${id}. ${types.join(' / ')}-type.</p>
<p>${genus ?? ''}</p>
<p>Abilities: ${abilities.join(', ')}.</p>
<p>Height: ${heightM} m (${heightFtWhole}'${heightInches}"). Weight: ${weightKg} kg (${weightLbs} lbs).</p>
${image ? `<img src="${image}" alt="${name} artwork">` : ''}
</body></html>`;

  return {
    documentId,
    title: `${name} Pokédex: stats, moves, evolution & locations`,
    data,
    fileExtension: '.html',
    pokemonname: name,
    pokemonnatdex: id,
    pokemontypes: types,
    pokemonimage: image,
    pokemonabilities: abilities,
    pokemonheight: `${heightM} m (${heightFtWhole}′${String(heightInches).padStart(2, '0')}″)`,
    pokemonweight: `${weightKg} kg (${weightLbs} lbs)`,
    pokemonspecies: genus,
    pokemongeneration: generation,
    permanentid: documentId,
    clickableuri: `https://pokemondb.net/pokedex/${pokemon.name}`,
  };
}

async function pushDoc(doc: PokemonDoc) {
  // PUT /documents?documentId=<encoded-id> — body is the single doc.
  // Cleaner than the batch endpoint (which needs a 3-step file container).
  const url = `${PLATFORM}/documents?documentId=${encodeURIComponent(doc.documentId)}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doc),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Push ${doc.documentId.slice(-30)} → ${r.status}: ${text.slice(0, 300)}`);
  }
}

async function main() {
  console.log(`▸ Push ingest: PokéAPI → Coveo source ${SOURCE_ID!.slice(-12)}`);

  let pushed = 0;
  for (let id = 1; id <= TARGET_COUNT; id++) {
    const doc = await buildDoc(id);
    if (!doc) continue;
    try {
      await pushDoc(doc);
      pushed += 1;
    } catch (err) {
      console.warn(`  ✗ push failed #${id}: ${err}`);
      continue;
    }
    if (id % 25 === 0 || id === TARGET_COUNT) {
      console.log(`  ✓ pushed ${String(pushed).padStart(4)}/${id} (last: #${id} ${doc.pokemonname})`);
    }
  }
  console.log(`\n▸ Done. ${pushed} documents pushed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
