import { buildSearchEngine } from '@coveo/headless';
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

export async function createPokedexEngine(): Promise<SearchEngine> {
  const { token, organizationId } = await fetchSearchToken();
  return buildSearchEngine({
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
}

export { POKEMON_FIELDS };
