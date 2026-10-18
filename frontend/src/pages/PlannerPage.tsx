import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Segmented } from '../components/Segmented';
import { DEFAULT_PROFILE, DEFAULT_SESSION } from '../data/sample';
import { goalLabels, intensityLabels, sportExamples, sportLabels, weatherLabels, weatherHints, fmt, formatDuration } from '../domain/labels';
import { computeTargets } from '../domain/nutrition';
import { buildPlan } from '../domain/schedule';
import type { Goal, Intensity, SessionInputs, SportFamily, Weather } from '../domain/types';
import { useStored } from '../hooks/useStored';
import { resolveProducts } from '../services/products';
import { planStore, profileStore } from '../services/storage';

export function PlannerPage() {
  const navigate = useNavigate();
  const storedProfile = useStored(profileStore.get);
  const profile = storedProfile ?? DEFAULT_PROFILE;
  const pantry = useMemo(() => resolveProducts(profile.favoriteProductIds), [profile.favoriteProductIds]);
  const [session, setSession] = useState<SessionInputs>(DEFAULT_SESSION);
  const [hours, setHours] = useState('2');
  const [minutes, setMinutes] = useState('0');
  const [error, setError] = useState('');

  const durationMin = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const draft = { ...session, durationMin };
  const preview = durationMin >= 10 ? computeTargets(profile, draft).targets : null;
  const set = <K extends keyof SessionInputs>(key: K, value: SessionInputs[K]) => setSession((s) => ({ ...s, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (durationMin < 10 || durationMin > 24 * 60) {
      setError('Indiquez une durée entre 10 minutes et 24 heures.');
      return;
    }
    const plan = buildPlan(profile, { ...draft, name: session.name.trim() || `${sportLabels[session.sport]}, ${formatDuration(durationMin)}` }, pantry);
    planStore.save(plan);
    navigate(`/plans/${plan.id}`);
  };

  return (
    <section className="page">
      <header className="page__head">
        <h1>Nouveau plan</h1>
        <p>
          {storedProfile
            ? <>Calculé pour {storedProfile.firstName || 'vous'}, {fmt(storedProfile.weightKg)} kg. <Link to="/profil">Modifier le profil</Link></>
            : <>Sans profil, le calcul part d'un athlète de 70 kg. <Link to="/profil">Renseigner mon profil</Link></>}
        </p>
      </header>

      <div className="planner">
        <form className="form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">Nom de la séance</span>
            <input value={session.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex. Triathlon de Dunkerque, sortie longue du dimanche" />
          </label>

          <Segmented<SportFamily>
            legend="Sport"
            name="sport"
            columns={2}
            value={session.sport}
            onChange={(v) => set('sport', v)}
            options={(Object.keys(sportLabels) as SportFamily[]).map((v) => ({ value: v, label: sportLabels[v], hint: sportExamples[v] }))}
          />

          <fieldset className="segmented">
            <legend className="field__label">Durée prévue</legend>
            <div className="duration">
              <label><input type="number" inputMode="numeric" min={0} max={24} value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Heures" /> h</label>
              <label><input type="number" inputMode="numeric" min={0} max={59} step={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutes" /> min</label>
            </div>
          </fieldset>

          <Segmented<Intensity>
            legend="Intensité"
            name="intensity"
            value={session.intensity}
            onChange={(v) => set('intensity', v)}
            options={(Object.keys(intensityLabels) as Intensity[]).map((v) => ({ value: v, label: intensityLabels[v] }))}
          />
          <Segmented<Weather>
            legend="Météo"
            name="weather"
            value={session.weather}
            onChange={(v) => set('weather', v)}
            options={(Object.keys(weatherLabels) as Weather[]).map((v) => ({ value: v, label: weatherLabels[v], hint: weatherHints[v] }))}
          />
          <Segmented<Goal>
            legend="Objectif"
            name="goal"
            value={session.goal}
            onChange={(v) => set('goal', v)}
            options={(Object.keys(goalLabels) as Goal[]).map((v) => ({ value: v, label: goalLabels[v] }))}
          />
          <Segmented<'15' | '20' | '30'>
            legend="Une prise toutes les"
            name="interval"
            value={String(session.intakeIntervalMin) as '15' | '20' | '30'}
            onChange={(v) => set('intakeIntervalMin', Number(v) as 15 | 20 | 30)}
            options={[{ value: '15', label: '15 min' }, { value: '20', label: '20 min' }, { value: '30', label: '30 min' }]}
          />

          <div className="toggles">
            <label className="toggle">
              <input type="checkbox" checked={session.isRace} onChange={(e) => set('isRace', e.target.checked)} />
              <span>C'est une compétition <small>ajoute la charge glucidique et la caféine d'avant-course</small></span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={session.nextSessionWithin24h} onChange={(e) => set('nextSessionWithin24h', e.target.checked)} />
              <span>Je m'entraîne à nouveau dans moins de 24 h <small>accélère la récupération</small></span>
            </label>
          </div>

          {error && <p className="notice notice--alert" role="alert">{error}</p>}
          <button className="button button--primary button--wide" type="submit">Générer le plan</button>
        </form>

        <aside className="preview" aria-live="polite" aria-label="Aperçu des besoins">
          <h2>Par heure d'effort</h2>
          {preview ? (
            <dl className="preview__list">
              <div><dt>Glucides</dt><dd>{preview.carbsPerHourG}<small> g</small></dd></div>
              <div><dt>Boisson</dt><dd>{preview.fluidPerHourMl}<small> ml</small></dd></div>
              <div><dt>Sodium</dt><dd>{preview.sodiumPerHourMg}<small> mg</small></dd></div>
              <div><dt>Caféine, total</dt><dd>{preview.caffeineTotalMg}<small> mg</small></dd></div>
            </dl>
          ) : (
            <p className="muted">Indiquez une durée pour voir vos besoins.</p>
          )}
          <div className="preview__pantry">
            <h3>Produits utilisés</h3>
            {pantry.length > 0 ? (
              <ul>{pantry.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
            ) : (
              <p className="muted">Aucun favori : le plan prendra des produits génériques.</p>
            )}
            <Link to="/produits">Choisir mes produits</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
