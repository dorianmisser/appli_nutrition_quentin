import { Link } from 'react-router-dom';
import { formatDate, formatDuration, sportLabels } from '../domain/labels';
import { useStored } from '../hooks/useStored';
import { effortStore, planStore } from '../services/storage';

export function HistoryPage() {
  const plans = useStored(planStore.list);
  const efforts = useStored(effortStore.list);
  const active = efforts.find((e) => !e.endedAt);

  if (plans.length === 0) {
    return (
      <section className="empty">
        <h1>Aucun plan pour l'instant</h1>
        <p>Vos plans et les séances suivies au chrono s'afficheront ici.</p>
        <Link className="button button--primary" to="/plan">Créer un plan</Link>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__head">
        <h1>Historique</h1>
        <p>{plans.length} plan{plans.length > 1 ? 's' : ''}, {efforts.filter((e) => e.endedAt).length} séance{efforts.length > 1 ? 's' : ''} suivie{efforts.length > 1 ? 's' : ''} au chrono.</p>
      </header>

      {active && (
        <p className="notice notice--live">
          Un chrono est en cours. <Link to={`/effort/${active.planId}`}>Reprendre la séance</Link>
        </p>
      )}

      <ul className="history">
        {plans.map((plan) => {
          const runs = efforts.filter((e) => e.planId === plan.id && e.endedAt);
          const last = runs[0];
          const adherence = last && plan.intakes.length
            ? Math.round((last.log.filter((l) => l.status === 'taken').length / plan.intakes.length) * 100)
            : null;
          return (
            <li key={plan.id} className="history__item">
              <Link to={`/plans/${plan.id}`} className="history__link">
                <span className="history__date">{formatDate(plan.createdAt)}</span>
                <strong>{plan.inputs.name}</strong>
                <span className="muted">
                  {sportLabels[plan.inputs.sport]}, {formatDuration(plan.inputs.durationMin)}, {plan.targets.carbsPerHourG} g/h
                </span>
              </Link>
              <span className="history__runs">
                {adherence === null ? 'Pas encore suivi' : `${runs.length} suivi${runs.length > 1 ? 's' : ''}, dernier à ${adherence} %`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
