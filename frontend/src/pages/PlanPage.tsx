import { Link, useNavigate, useParams } from 'react-router-dom';
import { FuelStrip } from '../components/FuelStrip';
import { GaugeBar } from '../components/GaugeBar';
import { Icon } from '../components/Icon';
import { planCoverage } from '../domain/gauges';
import { fmt, formatClock, formatDate, formatDuration, goalLabels, intensityLabels, sportLabels, weatherLabels } from '../domain/labels';
import type { Intake } from '../domain/types';
import { planStore } from '../services/storage';
import { NotFoundPage } from './NotFoundPage';

function groupByMinute(intakes: Intake[]) {
  const groups = new Map<number, Intake[]>();
  intakes.forEach((i) => groups.set(i.minute, [...(groups.get(i.minute) ?? []), i]));
  return [...groups.entries()];
}

export function PlanPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const plan = planStore.get(planId);
  if (!plan) return <NotFoundPage />;

  const { inputs, targets: t, before, after, energy } = plan;
  const remove = () => {
    if (window.confirm('Supprimer ce plan et ses séances enregistrées ?')) {
      planStore.remove(plan.id);
      navigate('/historique');
    }
  };

  return (
    <article className="page plan">
      <header className="plan__head">
        <div>
          <h1>{inputs.name}</h1>
          <p className="muted">
            {sportLabels[inputs.sport]}, {formatDuration(inputs.durationMin)}, intensité {intensityLabels[inputs.intensity].toLowerCase()},{' '}
            {weatherLabels[inputs.weather].toLowerCase()}, objectif {goalLabels[inputs.goal].toLowerCase()}
            {inputs.isRace ? ', compétition' : ''}. Créé le {formatDate(plan.createdAt)} pour {plan.athleteName || 'vous'} ({fmt(plan.weightKg)} kg).
          </p>
        </div>
        <div className="plan__actions no-print">
          {plan.intakes.length > 0 && (
            <Link className="button button--primary" to={`/effort/${plan.id}`}>
              <Icon name="play" size={16} /> Lancer le chrono
            </Link>
          )}
          <button className="button" type="button" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Imprimer
          </button>
          <button className="button button--ghost" type="button" onClick={remove}>
            <Icon name="trash" size={16} /> Supprimer
          </button>
        </div>
      </header>

      <dl className="figures">
        <div><dt>Glucides</dt><dd>{t.carbsPerHourG}<small> g/h</small></dd><p>Fourchette {t.carbsPerHourRange.min}–{t.carbsPerHourRange.max} g/h</p></div>
        <div><dt>Boisson</dt><dd>{t.fluidPerHourMl}<small> ml/h</small></dd><p>{fmt(t.totalFluidMl / 1000)} l au total</p></div>
        <div><dt>Sodium</dt><dd>{t.sodiumPerHourMg}<small> mg/h</small></dd><p>{t.sodiumPerHourMg ? `${fmt(t.totalSodiumMg)} mg au total` : 'Pas nécessaire ici'}</p></div>
        <div><dt>Dépense estimée</dt><dd>{fmt(energy.sessionKcal)}<small> kcal</small></dd><p>{energy.dailyKcal ? `${fmt(energy.dailyKcal)} kcal sur la journée` : 'Ajoutez taille et âge pour la journée'}</p></div>
      </dl>

      {plan.intakes.length > 0 && <FuelStrip durationMin={inputs.durationMin} intakes={plan.intakes} />}

      {plan.warnings.length > 0 && (
        <ul className="notices">
          {plan.warnings.map((w) => <li key={w} className="notice">{w}</li>)}
        </ul>
      )}

      <div className="plan__body">
        <section className="phase phase--before" aria-labelledby="avant">
          <h2 id="avant">Avant</h2>
          <ul className="phase__list">
            {before.carbLoadingGPerKgPerDay && (
              <li>
                <strong>{before.carbLoadingHours} h avant</strong>
                Charge glucidique : {before.carbLoadingGPerKgPerDay.min} à {before.carbLoadingGPerKgPerDay.max} g/kg par jour, soit{' '}
                {fmt(Math.round(plan.weightKg * before.carbLoadingGPerKgPerDay.min))} à {fmt(Math.round(plan.weightKg * before.carbLoadingGPerKgPerDay.max))} g par jour, en réduisant les fibres.
              </li>
            )}
            <li><strong>{before.mealHoursBefore} h avant</strong>Repas pauvre en fibres et en graisses, environ {before.mealCarbsG} g de glucides.</li>
            <li><strong>2 à 4 h avant</strong>Boire {before.fluidMl} ml, par petites gorgées.</li>
            {before.caffeineMg > 0 && <li><strong>1 h avant</strong>{before.caffeineMg} mg de caféine (un expresso en apporte environ 80).</li>}
            {before.snackCarbsG > 0 && <li><strong>30 min avant</strong>Une collation de {before.snackCarbsG} g de glucides si la faim se fait sentir.</li>}
          </ul>
        </section>

        <section className="phase phase--during" aria-labelledby="pendant">
          <h2 id="pendant">Pendant</h2>
          {plan.intakes.length === 0 ? (
            <p className="muted">Pas de ravitaillement nécessaire : buvez de l'eau à la soif.</p>
          ) : (
            <table className="schedule">
              <thead>
                <tr><th scope="col">Repère</th><th scope="col">Prise</th><th scope="col">Glucides</th><th scope="col">Sodium</th></tr>
              </thead>
              <tbody>
                {groupByMinute(plan.intakes).map(([minute, items]) => (
                  <tr key={minute}>
                    <th scope="row">{formatClock(minute)}</th>
                    <td>
                      {items.map((i) => (
                        <span key={i.id} className="schedule__item">
                          {i.productName}
                          {i.note && <small> {i.note}</small>}
                          {i.caffeineMg > 0 && <small className="tag">{i.caffeineMg} mg caféine</small>}
                        </span>
                      ))}
                    </td>
                    <td>{items.reduce((s, i) => s + i.carbsG, 0)} g</td>
                    <td>{items.reduce((s, i) => s + i.sodiumMg, 0)} mg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="phase phase--after" aria-labelledby="apres">
          <h2 id="apres">Après</h2>
          <ul className="phase__list">
            <li><strong>Dans les {after.windowMin} min</strong>{after.proteinG} g de protéines et {after.carbsG} g de glucides.</li>
            {after.carbsPerHourForFourHours && <li><strong>Pendant 4 h</strong>Continuez avec {after.carbsPerHourForFourHours} g de glucides par heure.</li>}
            <li><strong>D'ici le soir</strong>Boire environ {fmt(after.fluidMl / 1000)} l, avec un repas salé.</li>
            <li><strong>Au quotidien</strong>{energy.dailyCarbsGPerKg.min} à {energy.dailyCarbsGPerKg.max} g/kg de glucides et {fmt(energy.dailyProteinGPerKg.min)} à {fmt(energy.dailyProteinGPerKg.max)} g/kg de protéines.</li>
          </ul>
        </section>
      </div>

      {plan.intakes.length > 0 && (
        <section className="coverage" aria-labelledby="couverture">
          <h2 id="couverture">Ce que vos prises couvrent</h2>
          <div className="gauges">
            {planCoverage(plan).map((g) => <GaugeBar key={g.key} gauge={g} />)}
          </div>
        </section>
      )}
    </article>
  );
}
