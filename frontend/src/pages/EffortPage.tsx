import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FuelStrip } from '../components/FuelStrip';
import { GaugeBar } from '../components/GaugeBar';
import { Icon } from '../components/Icon';
import { liveGauges } from '../domain/gauges';
import { formatChrono, formatClock, formatDuration } from '../domain/labels';
import type { EffortSession, Intake } from '../domain/types';
import { effortStore, planStore } from '../services/storage';
import { NotFoundPage } from './NotFoundPage';

type WakeLock = { release: () => Promise<void> };

function groupByMinute(intakes: Intake[]) {
  const groups = new Map<number, Intake[]>();
  intakes.forEach((i) => groups.set(i.minute, [...(groups.get(i.minute) ?? []), i]));
  return [...groups.entries()].map(([minute, items]) => ({ minute, items }));
}

function describe(items: Intake[]) {
  return items.map((i) => (i.note && i.note.endsWith('ml') ? `${i.note} de ${i.productName.toLowerCase()}` : i.productName)).join(', ');
}

/** Rappels : notification système, vibration et bip, chacun ignoré silencieusement s'il n'est pas disponible. */
function useAlerts() {
  const audio = useRef<AudioContext | null>(null);
  const prepare = useCallback(async () => {
    try {
      audio.current ??= new AudioContext();
      if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    } catch {
      /* navigateur sans son ni notifications */
    }
  }, []);
  const alert = useCallback((title: string, body: string) => {
    try {
      navigator.vibrate?.([250, 120, 250]);
    } catch { /* pas de vibreur */ }
    const ctx = audio.current;
    if (ctx) {
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      });
    }
    try {
      if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, tag: 'chtri-prise' });
    } catch { /* notifications indisponibles (iOS hors application installée) */ }
  }, []);
  return { prepare, alert };
}

/** Garde l'écran allumé pendant l'effort quand le navigateur le permet. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLock | null = null;
    const request = async () => {
      try {
        lock = await (navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<WakeLock> } }).wakeLock.request('screen');
      } catch { /* refusé (batterie faible, onglet masqué) */ }
    };
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}

export function EffortPage() {
  const { planId = '' } = useParams();
  const plan = planStore.get(planId);
  const [session, setSession] = useState<EffortSession | null>(() => {
    const active = effortStore.active();
    return active && active.planId === planId ? active : null;
  });
  const [now, setNow] = useState(Date.now());
  const notified = useRef(new Set<number>());
  const { prepare, alert } = useAlerts();
  const running = Boolean(session && !session.endedAt);
  useWakeLock(running);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const groups = plan ? groupByMinute(plan.intakes) : [];
  const elapsedMs = session ? (session.endedAt ? Date.parse(session.endedAt) : now) - Date.parse(session.startedAt) : 0;
  const elapsedMin = elapsedMs / 60000;
  const logged = new Map(session?.log.map((l) => [l.intakeId, l.status]) ?? []);
  const isDone = (g: { items: Intake[] }) => g.items.every((i) => logged.has(i.id));
  const next = groups.find((g) => !isDone(g));

  // Rappel au moment où une prise devient due. Après un rechargement, les prises déjà passées ne sonnent pas.
  useEffect(() => {
    if (!running || !plan) return;
    groups.forEach((g) => {
      if (g.minute <= elapsedMin && !notified.current.has(g.minute)) {
        notified.current.add(g.minute);
        if (elapsedMin - g.minute < 1 && !isDone(g)) alert(`${formatClock(g.minute)} : à vous de jouer`, describe(g.items));
      }
    });
  });

  if (!plan) return <NotFoundPage />;

  const save = (updated: EffortSession) => {
    effortStore.save(updated);
    setSession(updated);
  };

  const start = async () => {
    await prepare();
    notified.current = new Set();
    const created: EffortSession = { id: crypto.randomUUID?.() ?? String(Date.now()), planId: plan.id, startedAt: new Date().toISOString(), log: [] };
    setNow(Date.now());
    save(created);
  };

  const mark = (items: Intake[], status: 'taken' | 'skipped') => {
    if (!session) return;
    const ids = new Set(items.map((i) => i.id));
    save({
      ...session,
      log: [...session.log.filter((l) => !ids.has(l.intakeId)), ...items.map((i) => ({ intakeId: i.id, takenAt: new Date().toISOString(), status }))],
    });
  };

  const undo = (items: Intake[]) => {
    if (!session) return;
    const ids = new Set(items.map((i) => i.id));
    save({ ...session, log: session.log.filter((l) => !ids.has(l.intakeId)) });
  };

  const finish = () => {
    if (session && window.confirm('Terminer la séance ?')) save({ ...session, endedAt: new Date().toISOString() });
  };

  const takenIds = new Set(session?.log.filter((l) => l.status === 'taken').map((l) => l.intakeId));
  const gauges = liveGauges(plan, session?.log ?? [], elapsedMin);

  if (!session) {
    const b = plan.before;
    return (
      <section className="effort effort--idle">
        <header className="page__head">
          <h1>{plan.inputs.name}</h1>
          <p>{formatDuration(plan.inputs.durationMin)}, {groups.length} rappels. Gardez cette page ouverte pendant l'effort : l'écran restera allumé si votre téléphone le permet.</p>
        </header>
        <section className="checklist" aria-labelledby="avant-depart">
          <h2 id="avant-depart">Avant le départ</h2>
          <ul>
            <li>Repas de {b.mealCarbsG} g de glucides, {b.mealHoursBefore} h avant.</li>
            <li>{b.fluidMl} ml d'eau dans les heures qui précèdent.</li>
            {b.caffeineMg > 0 && <li>{b.caffeineMg} mg de caféine, 1 h avant.</li>}
            <li>Produits prêts : {[...new Set(plan.intakes.map((i) => i.productName))].join(', ')}.</li>
          </ul>
        </section>
        <button type="button" className="button button--primary button--start" onClick={start}>
          <Icon name="play" /> Démarrer le chrono
        </button>
        <p className="muted">Le navigateur vous demandera d'autoriser les notifications : elles servent aux rappels quand l'écran est verrouillé.</p>
      </section>
    );
  }

  if (session.endedAt) {
    const planned = plan.intakes.length;
    const taken = session.log.filter((l) => l.status === 'taken').length;
    return (
      <section className="effort effort--done">
        <h1>Séance terminée</h1>
        <p className="effort__summary">
          {formatChrono(elapsedMs)} d'effort, {taken} prises sur {planned} ({planned ? Math.round((taken / planned) * 100) : 0} %).
        </p>
        <div className="gauges">{gauges.map((g) => <GaugeBar key={g.key} gauge={g} />)}</div>
        <div className="actions">
          <Link className="button button--primary" to={`/plans/${plan.id}`}>Revoir le plan</Link>
          <Link className="button" to="/historique">Historique</Link>
        </div>
      </section>
    );
  }

  const nextDue = next ? next.minute <= elapsedMin : false;
  const countdownMs = next ? next.minute * 60000 - elapsedMs : 0;

  return (
    <section className="effort">
      <div className="effort__clock">
        <p className="effort__plan">{plan.inputs.name}</p>
        <p className="effort__time" aria-label="Temps écoulé">{formatChrono(elapsedMs)}</p>
        <p className="muted">sur {formatDuration(plan.inputs.durationMin)} prévues</p>
      </div>

      {next ? (
        <section className={nextDue ? 'next is-due' : 'next'} aria-live="assertive">
          <p className="next__when">
            {nextDue ? `À prendre maintenant, repère ${formatClock(next.minute)}` : `Prochaine prise dans ${formatChrono(countdownMs).replace(/^0:/, '')}`}
          </p>
          <ul className="next__items">
            {next.items.map((i) => (
              <li key={i.id}>
                <strong>{i.productName}</strong>
                <span>{i.note}</span>
              </li>
            ))}
          </ul>
          <div className="next__actions">
            <button type="button" className="button button--primary button--big" onClick={() => mark(next.items, 'taken')}>
              <Icon name="check" /> C'est pris
            </button>
            <button type="button" className="button button--big" onClick={() => mark(next.items, 'skipped')}>
              <Icon name="skip" /> Passer
            </button>
          </div>
        </section>
      ) : (
        <section className="next">
          <p className="next__when">Toutes les prises sont faites. Terminez quand vous passez la ligne.</p>
        </section>
      )}

      <div className="gauges gauges--live">{gauges.map((g) => <GaugeBar key={g.key} gauge={g} />)}</div>

      <FuelStrip durationMin={plan.inputs.durationMin} intakes={plan.intakes} elapsedMin={elapsedMin} takenIds={takenIds} />

      <ol className="timeline">
        {groups.map((g) => {
          const status = isDone(g)
            ? g.items.every((i) => logged.get(i.id) === 'taken') ? 'taken' : 'skipped'
            : g.minute < elapsedMin - plan.inputs.intakeIntervalMin / 2 ? 'late' : 'pending';
          return (
            <li key={g.minute} className={`timeline__row timeline__row--${status}`}>
              <span className="timeline__clock">{formatClock(g.minute)}</span>
              <span className="timeline__what">{describe(g.items)}</span>
              {status === 'taken' || status === 'skipped' ? (
                <button type="button" className="link-button" onClick={() => undo(g.items)}>
                  {status === 'taken' ? 'Pris' : 'Passé'}, annuler
                </button>
              ) : (
                <button type="button" className="link-button" onClick={() => mark(g.items, 'taken')}>
                  {status === 'late' ? 'En retard, marquer pris' : 'Marquer pris'}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <button type="button" className="button button--ghost button--wide" onClick={finish}>Terminer la séance</button>
    </section>
  );
}
