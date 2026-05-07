import { buildSearchEngine } from '@coveo/headless';
import type { SearchEngine } from '@coveo/headless';
import { fetchSearchToken } from './tokenClient';

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
