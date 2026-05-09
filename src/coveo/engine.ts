import { buildSearchEngine, loadAdvancedSearchQueryActions } from '@coveo/headless';
import type { SearchEngine } from '@coveo/headless';
import { fetchSearchToken } from './tokenClient';

// Atomic only ships a small default set of result fields back to the browser.
// Listing our custom fields here ensures the result template can read them.
const POKEMON_FIELDS = [
  'pokemonname',
  'pokemonimage',
  'pokemontypes',
  'pokemonnatdex',
  'pokemonspecies',
  'pokemonheight',
  'pokemonweight',
  'pokemonabilities',
  'pokemongeneration',
] as const;

// Constrain every query to the PokéAPI-fed Push source. The legacy
// `pokedex-full` (Web Crawler) source still exists for narrative context in
// the deck — but the Push source has cleaner metadata and is what the UI
// queries. See the "two connectors" slide for why we keep both.
const POKEDEX_CONSTANT_QUERY = '@source=="pokedex-push"';

export async function createPokedexEngine(): Promise<SearchEngine> {
  const { token, organizationId } = await fetchSearchToken();
  const engine = buildSearchEngine({
    configuration: {
      accessToken: token,
      organizationId,
      search: {
        pipeline: 'Pokedex',
        searchHub: 'PokedexSearch',
      },
      analytics: { enabled: true },
      renewAccessToken: async () => {
        const next = await fetchSearchToken(true);
        return next.token;
      },
    },
  });

  // Register a server-side `cq` so every search is scoped to the Push source.
  const { registerAdvancedSearchQueries } = loadAdvancedSearchQueryActions(engine);
  engine.dispatch(registerAdvancedSearchQueries({ cq: POKEDEX_CONSTANT_QUERY }));

  return engine;
}

export { POKEMON_FIELDS };
