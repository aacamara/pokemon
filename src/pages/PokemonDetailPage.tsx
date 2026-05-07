import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSearchToken } from '../coveo/tokenClient';
import { dedupePreserveOrder, generationFromNatdex, pokedexArtworkUrl } from '../coveo/derive';
import GenerationBadge from '../components/GenerationBadge';

type SearchResult = {
  title: string;
  uri: string;
  clickUri: string;
  raw: Record<string, unknown>;
};

type SearchResponse = {
  results?: SearchResult[];
  totalCount?: number;
};

async function searchPokedex(
  organizationId: string,
  token: string,
  payload: Record<string, unknown>,
): Promise<SearchResult[]> {
  const url = `https://${organizationId}.org.coveo.com/rest/search/v2?organizationId=${encodeURIComponent(organizationId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      searchHub: 'PokedexSearch',
      pipeline: 'Pokedex',
      ...payload,
    }),
  });
  const json = (await res.json()) as SearchResponse;
  if (!res.ok) throw new Error(`Search API failed: ${res.status}`);
  return json.results || [];
}

export default function PokemonDetailPage() {
  const { name } = useParams<{ name: string }>();
  const [pokemon, setPokemon] = useState<SearchResult | null>(null);
  const [related, setRelated] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPokemon(null);
    setRelated([]);

    (async () => {
      try {
        const { token, organizationId } = await fetchSearchToken();
        const lower = name.toLowerCase();

        const main = await searchPokedex(organizationId, token, {
          q: name,
          cq: `@pokemonname=="${lower}"`,
          numberOfResults: 1,
        });
        if (cancelled) return;
        const first = main[0];
        if (!first) {
          setError(`No Pokémon found for "${name}".`);
          return;
        }
        setPokemon(first);

        const raw = first.raw as Record<string, unknown>;
        const generation = raw.pokemongeneration;
        const types = (raw.pokemontypes as string[] | undefined) ?? [];
        const filters: string[] = [];
        if (generation != null) filters.push(`@pokemongeneration==${generation}`);
        if (types[0]) filters.push(`@pokemontypes==${types[0]}`);

        if (filters.length) {
          const relatedResults = await searchPokedex(organizationId, token, {
            q: '',
            cq: `(${filters.join(' AND ')}) AND NOT @pokemonname=="${lower}"`,
            numberOfResults: 6,
            sortCriteria: '@pokemonnatdex ascending',
          });
          if (!cancelled) setRelated(relatedResults);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loading) return <div className="bootstrap-message">Loading {name}…</div>;
  if (error) {
    return (
      <div className="bootstrap-message bootstrap-message--error">
        <p>{error}</p>
        <Link to="/">← back to search</Link>
      </div>
    );
  }
  if (!pokemon) return null;

  const r = pokemon.raw as Record<string, unknown>;
  const types = dedupePreserveOrder(r.pokemontypes as string[] | undefined);
  const abilities = dedupePreserveOrder(r.pokemonabilities as string[] | undefined);
  const generation =
    (r.pokemongeneration as number | undefined) ??
    generationFromNatdex(r.pokemonnatdex as string | undefined);

  return (
    <article className="poke-detail">
      <Link to="/" className="poke-detail__back">← Back to search</Link>
      <header className="poke-detail__hero">
        {(() => {
          const img =
            (r.pokemonimage as string | undefined) ??
            pokedexArtworkUrl(r.pokemonname as string | undefined, pokemon.uri);
          return img ? <img src={img} alt={pokemon.title} /> : null;
        })()}
        <div>
          <h1>{pokemon.title}</h1>
          {(r.pokemonnatdex as string | undefined) && (
            <div className="poke-detail__natdex">National №{r.pokemonnatdex as string}</div>
          )}
          <ul className="poke-detail__types">
            {types.map((t) => (
              <li key={t} className={`type-${t.toLowerCase()}`}>{t}</li>
            ))}
          </ul>
          {(r.pokemonspecies as string | undefined) && (
            <p className="poke-detail__species">{r.pokemonspecies as string}</p>
          )}
        </div>
      </header>

      <dl className="poke-detail__facts">
        {generation != null && (
          <div>
            <dt>Generation</dt>
            <dd><GenerationBadge generation={Number(generation)} /></dd>
          </div>
        )}
        {(r.pokemonheight as string | undefined) && (
          <div><dt>Height</dt><dd>{r.pokemonheight as string}</dd></div>
        )}
        {(r.pokemonweight as string | undefined) && (
          <div><dt>Weight</dt><dd>{r.pokemonweight as string}</dd></div>
        )}
        {abilities.length > 0 && (
          <div><dt>Abilities</dt><dd>{abilities.join(', ')}</dd></div>
        )}
      </dl>

      {related.length > 0 && (
        <section className="poke-detail__related">
          <h2>Related Pokémon</h2>
          <ul>
            {related.map((rel) => {
              const rr = rel.raw as Record<string, unknown>;
              const relName = rr.pokemonname as string | undefined;
              const relImg =
                (rr.pokemonimage as string | undefined) ??
                pokedexArtworkUrl(relName, rel.uri);
              if (!relName) return null;
              return (
                <li key={rel.uri}>
                  <Link to={`/pokemon/${relName}`}>
                    {relImg && <img src={relImg} alt={rel.title} loading="lazy" />}
                    <span>{rel.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <a className="poke-detail__source" href={pokemon.clickUri} target="_blank" rel="noreferrer">
        View on pokemondb.net ↗
      </a>
    </article>
  );
}
