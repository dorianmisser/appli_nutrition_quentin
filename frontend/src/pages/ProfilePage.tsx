import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Chips, Segmented } from '../components/Segmented';
import { DEFAULT_PROFILE } from '../data/sample';
import { caffeineLabels, gutLabels, sexLabels, sweatLabels, tasteLabels } from '../domain/labels';
import type { AthleteProfile, CaffeinePreference, GutTraining, Sex, SweatRate, Taste } from '../domain/types';
import { profileStore } from '../services/storage';

const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value.replace(',', '.')));

export function ProfilePage() {
  const [profile, setProfile] = useState<AthleteProfile>(() => profileStore.get() ?? DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof AthleteProfile>(key: K, value: AthleteProfile[K]) => {
    setSaved(false);
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!profile.weightKg || profile.weightKg < 35 || profile.weightKg > 200) {
      setError('Indiquez un poids entre 35 et 200 kg : tous les calculs en dépendent.');
      return;
    }
    if (profile.measuredSweatLossLh !== undefined && (profile.measuredSweatLossLh < 0.2 || profile.measuredSweatLossLh > 3)) {
      setError('La perte sudorale mesurée doit être comprise entre 0,2 et 3 litres par heure.');
      return;
    }
    setError('');
    profileStore.save({ ...profile, firstName: profile.firstName.trim() });
    setSaved(true);
  };

  return (
    <section className="page page--narrow">
      <header className="page__head">
        <h1>Votre profil</h1>
        <p>Enregistré sur cet appareil. Il sert de base à chacun de vos plans.</p>
      </header>

      <form className="form" onSubmit={submit} noValidate>
        <div className="form__group">
          <h2>Vous</h2>
          <div className="grid grid--2">
            <label className="field">
              <span className="field__label">Prénom</span>
              <input value={profile.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" placeholder="Camille" />
            </label>
            <label className="field">
              <span className="field__label">Poids (kg)</span>
              <input type="number" inputMode="decimal" min={35} max={200} required value={profile.weightKg || ''} onChange={(e) => set('weightKg', Number(e.target.value))} />
            </label>
            <label className="field">
              <span className="field__label">Taille (cm) <em>facultatif</em></span>
              <input type="number" inputMode="numeric" min={120} max={230} value={profile.heightCm ?? ''} onChange={(e) => set('heightCm', toNumber(e.target.value))} />
            </label>
            <label className="field">
              <span className="field__label">Âge <em>facultatif</em></span>
              <input type="number" inputMode="numeric" min={12} max={100} value={profile.age ?? ''} onChange={(e) => set('age', toNumber(e.target.value))} />
            </label>
            <label className="field">
              <span className="field__label">Sexe <em>facultatif</em></span>
              <select value={profile.sex ?? ''} onChange={(e) => set('sex', (e.target.value || undefined) as Sex | undefined)}>
                <option value="">Non précisé</option>
                {(Object.keys(sexLabels) as Sex[]).map((s) => <option key={s} value={s}>{sexLabels[s]}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Entraînement par semaine (h) <em>facultatif</em></span>
              <input type="number" inputMode="decimal" min={0} max={40} value={profile.weeklyTrainingHours ?? ''} onChange={(e) => set('weeklyTrainingHours', toNumber(e.target.value))} />
            </label>
          </div>
          <p className="form__hint">Taille, âge et sexe permettent d'estimer votre dépense journalière ; le volume d'entraînement règle vos glucides quotidiens.</p>
        </div>

        <div className="form__group">
          <h2>Pendant l'effort</h2>
          <Segmented<SweatRate>
            legend="Votre sudation"
            name="sweat"
            value={profile.sweatRate}
            onChange={(v) => set('sweatRate', v)}
            options={(Object.keys(sweatLabels) as SweatRate[]).map((v) => ({ value: v, label: sweatLabels[v] }))}
          />
          <label className="field">
            <span className="field__label">Perte mesurée (litres par heure) <em>facultatif</em></span>
            <input type="number" inputMode="decimal" step="0.1" min={0.2} max={3} value={profile.measuredSweatLossLh ?? ''} onChange={(e) => set('measuredSweatLossLh', toNumber(e.target.value))} />
            <small className="field__help">Pesez-vous nu avant et après une heure d'effort, ajoutez ce que vous avez bu : 1 kg perdu = 1 litre.</small>
          </label>
          <Segmented<GutTraining>
            legend="Manger en bougeant"
            name="gut"
            value={profile.gutTraining}
            onChange={(v) => set('gutTraining', v)}
            options={(Object.keys(gutLabels) as GutTraining[]).map((v) => ({ value: v, label: gutLabels[v] }))}
          />
          <Segmented<CaffeinePreference>
            legend="Caféine"
            name="caffeine"
            value={profile.caffeine}
            onChange={(v) => set('caffeine', v)}
            options={(Object.keys(caffeineLabels) as CaffeinePreference[]).map((v) => ({ value: v, label: caffeineLabels[v], hint: v === 'none' ? undefined : v === 'low' ? '2 mg/kg' : '3 mg/kg' }))}
          />
          <Chips<Taste>
            legend="Goûts préférés"
            values={profile.tastes}
            onChange={(v) => set('tastes', v)}
            options={(Object.keys(tasteLabels) as Taste[]).map((v) => ({ value: v, label: tasteLabels[v] }))}
          />
        </div>

        {error && <p className="notice notice--alert" role="alert">{error}</p>}
        <div className="actions">
          <button className="button button--primary" type="submit">Enregistrer le profil</button>
          {saved && (
            <p className="saved" role="status">
              Profil enregistré. <Link to="/plan">Créer un plan</Link>
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
