import type { Intake, ProductType } from '../domain/types';
import { findProduct } from '../services/products';
import { formatClock } from '../domain/labels';

interface Props {
  durationMin: number;
  intakes: Intake[];
  elapsedMin?: number;
  takenIds?: Set<string>;
  label?: string;
}

type Kind = 'drink' | 'carb' | 'salt' | 'caffeine';

function kindOf(intake: Intake, type?: ProductType): Kind {
  if (intake.caffeineMg > 0) return 'caffeine';
  if (type === 'electrolyte') return 'salt';
  if (type === 'drink') return 'drink';
  return 'carb';
}

/**
 * Le ruban de ravitaillement : la séance vue comme un parcours, avec un repère à chaque prise.
 * C'est l'élément central de l'interface, réutilisé sur l'accueil, le plan et le mode effort.
 */
export function FuelStrip({ durationMin, intakes, elapsedMin, takenIds, label = 'Ruban de ravitaillement' }: Props) {
  const byMinute = new Map<number, Intake[]>();
  intakes.forEach((i) => byMinute.set(i.minute, [...(byMinute.get(i.minute) ?? []), i]));
  const tickStep = durationMin > 300 ? 60 : 30;
  const ticks: number[] = [];
  for (let t = 0; t <= durationMin; t += tickStep) ticks.push(t);
  // La fin de séance remplace le dernier repère s'il en est trop proche, pour garder les libellés lisibles.
  if (durationMin - ticks[ticks.length - 1]! < tickStep * 0.5 && ticks.length > 1) ticks.pop();
  if (ticks[ticks.length - 1] !== durationMin) ticks.push(durationMin);
  const tallest = Math.max(1, ...[...byMinute.values()].map((items) => items.length));
  const pos = (minute: number) => `${(minute / durationMin) * 100}%`;
  const progress = elapsedMin !== undefined ? Math.min(100, (elapsedMin / durationMin) * 100) : undefined;

  return (
    <figure className="strip" aria-label={label}>
      <div className="strip__scroller">
        <div className="strip__inner" style={{ minWidth: `${Math.max(560, byMinute.size * 46)}px` }}>
          <div className="strip__stacks" style={{ height: `${tallest * 19 + 10}px` }}>
            {[...byMinute.entries()].map(([minute, items]) => (
              <div key={minute} className="strip__stack" style={{ left: pos(minute) }}>
                {items.map((intake) => {
                  const kind = kindOf(intake, findProduct(intake.productId)?.type);
                  const done = takenIds?.has(intake.id);
                  return (
                    <span
                      key={intake.id}
                      className={`strip__pip strip__pip--${kind}${done ? ' is-done' : ''}`}
                      title={`${formatClock(minute)} ${intake.productName}${intake.note ? ` (${intake.note})` : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="strip__track">
            {progress !== undefined && <span className="strip__progress" style={{ width: `${progress}%` }} />}
            {[...byMinute.keys()].map((minute) => (
              <span key={minute} className="strip__notch" style={{ left: pos(minute) }} />
            ))}
          </div>
          <div className="strip__ticks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ left: pos(t) }}>{t === 0 ? 'Départ' : formatClock(t)}</span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="strip__legend">
        <span><i className="strip__pip strip__pip--drink" />Boisson</span>
        <span><i className="strip__pip strip__pip--carb" />Glucides</span>
        <span><i className="strip__pip strip__pip--caffeine" />Caféine</span>
        <span><i className="strip__pip strip__pip--salt" />Sel</span>
      </figcaption>
    </figure>
  );
}
