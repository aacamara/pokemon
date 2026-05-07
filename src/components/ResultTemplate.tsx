import { AtomicResultLink } from '@coveo/atomic-react';
import type { Result } from '@coveo/headless';
import GenerationBadge from './GenerationBadge';
import { dedupePreserveOrder, generationFromNatdex } from '../coveo/derive';

export default function ResultTemplate(result: Result) {
  const raw = result.raw as Record<string, unknown>;
  const image = raw.pokemonimage as string | undefined;
  const species = raw.pokemonspecies as string | undefined;
  const natdex = raw.pokemonnatdex as string | undefined;
  const types = dedupePreserveOrder(raw.pokemontypes as string[] | undefined);
  const generation =
    (raw.pokemongeneration as number | undefined) ?? generationFromNatdex(natdex);

  return (
    <article className="poke-card">
      {image && (
        <div className="poke-card__visual">
          <img src={image} alt={result.title} loading="lazy" />
        </div>
      )}
      <div className="poke-card__body">
        <div className="poke-card__title">
          <AtomicResultLink />
          {natdex && <span className="poke-card__natdex">№ {natdex}</span>}
        </div>
        {types.length > 0 && (
          <ul className="poke-card__types">
            {types.map((t) => (
              <li key={t} className={`type-${t.toLowerCase()}`}>{t}</li>
            ))}
          </ul>
        )}
        <div className="poke-card__meta">
          {generation != null && <GenerationBadge generation={Number(generation)} />}
          {species && <span className="poke-card__species">{species}</span>}
        </div>
      </div>
    </article>
  );
}
