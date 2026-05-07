import { AtomicResultLink, AtomicResultMultiValueText } from '@coveo/atomic-react';
import type { Result } from '@coveo/headless';
import GenerationBadge from './GenerationBadge';

export default function ResultTemplate(result: Result) {
  const raw = result.raw as Record<string, unknown>;
  const image = raw.pokemonimage as string | undefined;
  const generation = raw.pokemongeneration as number | undefined;
  const species = raw.pokemonspecies as string | undefined;
  const natdex = raw.pokemonnatdex as string | undefined;

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
        <div className="poke-card__types">
          <AtomicResultMultiValueText field="pokemontypes" />
        </div>
        <div className="poke-card__meta">
          {generation != null && <GenerationBadge generation={Number(generation)} />}
          {species && <span className="poke-card__species">{species}</span>}
        </div>
      </div>
    </article>
  );
}
