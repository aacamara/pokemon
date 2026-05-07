import { useState, type FormEvent } from 'react';

type Passage = {
  text: string;
  relevanceScore: number;
  document: {
    title?: string;
    permanentid?: string;
    pokemonname?: string;
    pokemonimage?: string;
    pokemontypes?: string[];
    pokemongeneration?: number;
    clickableuri?: string;
  };
};

type PassageResponse = {
  items?: Passage[];
  responseId?: string;
  error?: string;
};

const SAMPLE_QUESTIONS = [
  'Which Gen 1 Pokémon has the highest Special Attack?',
  'What does Lucario evolve from?',
  'Which legendary Pokémon learns Aeroblast?',
  'Which fire-type starter has the highest base speed?',
];

export default function AskPokedex() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [passages, setPassages] = useState<Passage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    setLoading(true);
    setError(null);
    setPassages(null);
    try {
      const res = await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question, maxPassages: 5 }),
      });
      const json = (await res.json()) as PassageResponse;
      if (!res.ok) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
      }
      setPassages(json.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    void ask(query.trim());
  }

  return (
    <section className="ask-pokedex">
      <header className="ask-pokedex__header">
        <h2>Ask the Pokédex</h2>
        <p>
          Backed by Coveo&apos;s <code>/rest/search/v3/passages/retrieve</code> endpoint —
          the same Passage Retrieval API that powers Coveo&apos;s agentic AI features.
        </p>
      </header>
      <form className="ask-pokedex__form" onSubmit={onSubmit}>
        <input
          type="text"
          aria-label="Ask a question about any Pokémon"
          placeholder="e.g., which Gen 1 Pokémon has the highest Special Attack?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </form>
      <div className="ask-pokedex__samples">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="ask-pokedex__chip"
            onClick={() => {
              setQuery(q);
              void ask(q);
            }}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>
      {error && <div className="ask-pokedex__error">{error}</div>}
      {passages && (
        <ul className="ask-pokedex__results">
          {passages.length === 0 && (
            <li className="ask-pokedex__empty">No passages came back for that question.</li>
          )}
          {passages.map((p, i) => (
            <li key={p.document.permanentid ?? i} className="ask-pokedex__passage">
              {p.document.pokemonimage && (
                <img
                  src={p.document.pokemonimage}
                  alt={p.document.pokemonname || p.document.title || 'Pokémon'}
                  loading="lazy"
                />
              )}
              <div>
                <div className="ask-pokedex__passage-head">
                  <strong>{p.document.pokemonname || p.document.title}</strong>
                  <span className="score">score {p.relevanceScore.toFixed(2)}</span>
                </div>
                <p>{p.text}</p>
                {p.document.clickableuri && (
                  <a href={p.document.clickableuri} target="_blank" rel="noreferrer">
                    View source ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
