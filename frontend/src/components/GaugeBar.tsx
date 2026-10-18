import type { Gauge } from '../domain/gauges';
import { fmt } from '../domain/labels';

const levelText = { ok: 'Dans la cible', watch: 'À surveiller', alert: 'Hors cible' } as const;

/** Jauge horizontale : remplissage = réalisé, repère vertical = prévu (ou plafond pour la caféine). */
export function GaugeBar({ gauge }: { gauge: Gauge }) {
  const scaleMax = Math.max(gauge.limit ?? 0, gauge.expected * 1.3, gauge.actual, 1);
  const fill = Math.min(100, (gauge.actual / scaleMax) * 100);
  const marker = ((gauge.limit ?? gauge.expected) / scaleMax) * 100;
  return (
    <div className={`gauge gauge--${gauge.level}`}>
      <div className="gauge__head">
        <span className="gauge__label">{gauge.label}</span>
        <span className="gauge__value">
          {fmt(gauge.actual)}
          <small> / {fmt(gauge.limit ?? gauge.expected)} {gauge.unit}</small>
        </span>
      </div>
      <div
        className="gauge__track"
        role="meter"
        aria-label={gauge.label}
        aria-valuemin={0}
        aria-valuemax={Math.round(scaleMax)}
        aria-valuenow={Math.round(gauge.actual)}
        aria-valuetext={`${fmt(gauge.actual)} ${gauge.unit}, ${levelText[gauge.level]}`}
      >
        <span className="gauge__fill" style={{ width: `${fill}%` }} />
        <span className="gauge__marker" style={{ left: `${marker}%` }} />
      </div>
      <p className="gauge__message">
        <span className="gauge__dot" aria-hidden="true" />
        {gauge.message}
      </p>
    </div>
  );
}
