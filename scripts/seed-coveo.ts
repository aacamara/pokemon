/**
 * One-shot script to provision a fresh Coveo organization for the
 * Pokémon Challenge.
 *
 *   COVEO_ORG_ID=…  COVEO_API_KEY=… npx tsx scripts/seed-coveo.ts
 *
 * What it does:
 *   1. Creates the 9 Pokémon-related fields (idempotent — skips existing).
 *   2. Creates the `Pokedex` query pipeline (idempotent).
 *   3. Logs the next manual steps for sources, IPE, and ML models, since
 *      those are easier to drive in the Admin Console UI.
 *
 * Required API key privileges:
 *   • Content > Fields > Edit
 *   • Search > Query pipelines > Edit
 *
 * Implementation notes:
 *   - Uses the global fetch (Node 18+ / 25+ ships fetch natively).
 *   - Bails out fast if a request returns 401/403 so you can fix the API key.
 */

const orgId = process.env.COVEO_ORG_ID;
const apiKey = process.env.COVEO_API_KEY;

if (!orgId || !apiKey) {
  console.error(
    'COVEO_ORG_ID and COVEO_API_KEY must be set in the environment.',
  );
  process.exit(1);
}

const PLATFORM = `https://platform.cloud.coveo.com/rest/organizations/${orgId}`;

type FieldDef = {
  name: string;
  type: 'STRING' | 'LONG_64' | 'DOUBLE' | 'BOOLEAN' | 'DATE';
  facet?: boolean;
  multiValueFacet?: boolean;
  multiValueFacetTokenizers?: string;
  sort?: boolean;
  includeInQuery?: boolean;
  includeInResults?: boolean;
};

const FIELDS: FieldDef[] = [
  { name: 'pokemonname',       type: 'STRING',  facet: true,             sort: true,  includeInQuery: true,  includeInResults: true },
  { name: 'pokemontypes',      type: 'STRING',  multiValueFacet: true,   multiValueFacetTokenizers: ';', includeInQuery: true,  includeInResults: true },
  { name: 'pokemongeneration', type: 'LONG_64', facet: true,             sort: true,  includeInQuery: true,  includeInResults: true },
  { name: 'pokemonimage',      type: 'STRING',                                                                                  includeInResults: true },
  { name: 'pokemonnatdex',     type: 'STRING',  sort: true,                                                  includeInQuery: true,  includeInResults: true },
  { name: 'pokemonspecies',    type: 'STRING',  facet: true,                                                                    includeInResults: true },
  { name: 'pokemonheight',     type: 'STRING',                                                                                  includeInResults: true },
  { name: 'pokemonweight',     type: 'STRING',                                                                                  includeInResults: true },
  { name: 'pokemonabilities',  type: 'STRING',  multiValueFacet: true,   multiValueFacetTokenizers: ';',                       includeInResults: true },
];

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${PLATFORM}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `${method} ${path} -> ${res.status} ${res.statusText}\n${text}`,
    );
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function ensureFields(defs: FieldDef[]) {
  console.log(`▸ Ensuring ${defs.length} fields exist…`);
  try {
    await api('POST', '/indexes/fields/batch/create', defs);
    console.log('  ✓ fields created');
  } catch (err) {
    const msg = String(err);
    if (msg.includes('FIELD_ALREADY_EXISTS') || msg.includes('already exists')) {
      console.log('  ↪ at least one field already exists; falling back to per-field create');
      for (const f of defs) {
        try {
          await api('POST', '/indexes/fields', f);
          console.log(`    ✓ created ${f.name}`);
        } catch (innerErr) {
          if (String(innerErr).includes('already exists')) {
            console.log(`    ↪ ${f.name} already exists, skipping`);
          } else {
            throw innerErr;
          }
        }
      }
    } else {
      throw err;
    }
  }
}

async function ensurePipeline(name: string) {
  console.log(`▸ Ensuring query pipeline "${name}" exists…`);
  // The pipelines admin endpoint lives at /rest/search/admin/pipelines, not under /rest/organizations/{id}.
  const url = `https://platform.cloud.coveo.com/rest/search/admin/pipelines?organizationId=${orgId}`;
  const list = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  }).then((r) => r.json() as Promise<Array<{ name: string }>>);
  if (Array.isArray(list) && list.some((p) => p.name === name)) {
    console.log('  ↪ pipeline already exists, skipping');
    return;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST pipelines -> ${res.status} ${res.statusText}\n${body}`);
  }
  console.log('  ✓ pipeline created');
}

async function main() {
  await ensureFields(FIELDS);
  await ensurePipeline('Pokedex');
  console.log(`
Next manual steps in the Coveo Admin Console:

  1. Create the two Web sources (pokedex-sandbox + pokedex-full) and paste
     coveo/web-scraping-config.json into "Edit with JSON".
  2. Create the Indexing Pipeline Extension from coveo/extension-generation.py
     and apply it to pokedex-full.
  3. Build the sources, then add the RGA + Query Suggestions ML models and
     associate them with the "Pokedex" pipeline.
  4. Run \`npx vercel --prod\` to deploy and configure env vars.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
