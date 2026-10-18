import { Link } from 'react-router-dom';
import { FuelStrip } from '../components/FuelStrip';
import { samplePlan } from '../data/sample';
import { formatDuration } from '../domain/labels';
import { useStored } from '../hooks/useStored';
import { planStore, profileStore } from '../services/storage';

export function HomePage() {
  const profile = useStored(profileStore.get);
  const lastPlan = useStored(planStore.list)[0];
  const t = samplePlan.targets;

  return (
    <>
      <section className="hero">
        <h1 className="hero__title">Sachez quoi prendre, et à quelle minute.</h1>
        <p className="hero__lead">
          Décrivez votre séance ou votre course : vous repartez avec un plan de ravitaillement minuté, construit avec les
          produits que vous aimez, et un chrono qui vous rappelle chaque prise pendant l'effort.
        </p>
        <div className="actions">
          <Link className="button button--primary" to="/plan">Créer un plan</Link>
          {!profile && <Link className="button" to="/profil">Renseigner mon profil</Link>}
          {lastPlan && (
            <Link className="button" to={`/plans/${lastPlan.id}`}>
              Reprendre « {lastPlan.inputs.name || 'mon dernier plan'} »
            </Link>
          )}
        </div>
      </section>

      <section className="showcase" aria-labelledby="exemple">
        <div className="showcase__head">
          <h2 id="exemple">Triathlon M, 2 h 40 à bloc</h2>
          <p>
            {t.carbsPerHourG} g de glucides et {t.fluidPerHourMl} ml par heure, {samplePlan.intakes.length} prises sur{' '}
            {formatDuration(samplePlan.inputs.durationMin)}.
          </p>
        </div>
        <FuelStrip durationMin={samplePlan.inputs.durationMin} intakes={samplePlan.intakes} label="Exemple de ruban pour un triathlon M" />
      </section>

      <section className="steps" aria-label="Comment ça marche">
        <ol>
          <li>
            <h3>Votre profil</h3>
            <p>Poids, sudation, habitude de manger en courant, goûts : ce qui change vraiment vos besoins.</p>
          </li>
          <li>
            <h3>Votre séance</h3>
            <p>Sport, durée, intensité, météo. Le plan répartit glucides, eau, sodium et caféine minute par minute.</p>
          </li>
          <li>
            <h3>Le jour J</h3>
            <p>Lancez le chrono : un rappel à chaque prise, des jauges qui passent à l'orange si vous prenez du retard.</p>
          </li>
        </ol>
      </section>
    </>
  );
}
