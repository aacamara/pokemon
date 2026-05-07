import { useEffect, useState } from 'react';
import {
  AtomicSearchInterface,
  AtomicSearchBox,
  AtomicSearchBoxQuerySuggestions,
  AtomicSearchBoxRecentQueries,
  AtomicLayoutSection,
  AtomicFacet,
  AtomicResultList,
  AtomicGeneratedAnswer,
  AtomicQuerySummary,
  AtomicLoadMoreResults,
  AtomicNoResults,
  AtomicQueryError,
} from '@coveo/atomic-react';
import type { SearchEngine } from '@coveo/headless';
import { createPokedexEngine, POKEMON_FIELDS } from '../coveo/engine';
import ResultTemplate from '../components/ResultTemplate';
import AskPokedex from '../components/AskPokedex';

export default function SearchPage() {
  const [engine, setEngine] = useState<SearchEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createPokedexEngine()
      .then((e) => {
        if (!cancelled) setEngine(e);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="bootstrap-message bootstrap-message--error">
        <h2>Coveo connection failed</h2>
        <p>{error}</p>
        <p>
          Confirm <code>COVEO_ORG_ID</code> and <code>COVEO_API_KEY</code> are set on
          the server, and that the Pokedex search hub exists in your org.
        </p>
      </div>
    );
  }

  if (!engine) {
    return <div className="bootstrap-message">Loading Coveo engine…</div>;
  }

  return (
    <AtomicSearchInterface
      engine={engine}
      fieldsToInclude={[...POKEMON_FIELDS]}
    >
      <div className="search-shell">
        <div className="search-bar-wrap">
          <AtomicSearchBox suggestionTimeout={500}>
            <AtomicSearchBoxRecentQueries />
            <AtomicSearchBoxQuerySuggestions />
          </AtomicSearchBox>
        </div>

        <div className="search-status">
          <AtomicQuerySummary />
        </div>

        <div className="search-grid">
          <aside className="search-grid__facets">
            <AtomicLayoutSection section="facets">
              <AtomicFacet field="pokemontypes" label="Type" />
              <AtomicFacet field="pokemongeneration" label="Generation" sortCriteria="alphanumeric" />
            </AtomicLayoutSection>
          </aside>

          <section className="search-grid__main">
            <AtomicLayoutSection section="main">
              <AtomicGeneratedAnswer />
              <AtomicResultList template={ResultTemplate} />
              <AtomicLoadMoreResults />
              <AtomicNoResults />
              <AtomicQueryError />
            </AtomicLayoutSection>
          </section>
        </div>

        <AskPokedex />
      </div>
    </AtomicSearchInterface>
  );
}
