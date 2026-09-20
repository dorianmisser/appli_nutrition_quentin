const form = document.querySelector('#nutrition-form');
const resultPanel = document.querySelector('#result-panel');

const sportLabels = {
  endurance: 'Endurance',
  team: 'Sport collectif',
  strength: 'Force',
  precision: 'Précision'
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('firstName')).trim() || 'athlète';
  const weight = Number(data.get('weight'));
  const duration = Number(data.get('duration'));
  const intensity = String(data.get('intensity'));
  const sport = String(data.get('sport'));
  const goal = String(data.get('goal'));

  const intensityFactor = { low: 0.85, medium: 1, high: 1.18 }[intensity];
  const sportFactor = { endurance: 1.1, team: 1, strength: 0.9, precision: 0.8 }[sport];
  const carbs = Math.round(weight * (duration / 60) * intensityFactor * sportFactor * 0.8);
  const hydration = Math.round(duration * (intensity === 'high' ? 11 : 9));
  const protein = Math.round(weight * (goal === 'recover' ? 0.35 : 0.28));
  const calories = Math.round((carbs * 4 + protein * 4 + weight * 0.35 * 9) / 10) * 10;
  const recovery = goal === 'recover' ? 'dans les 30 min' : 'dans les 60 min';

  resultPanel.innerHTML = `<div class="result-content">
    <p class="eyebrow">feuille de route pour ${sportLabels[sport]}</p>
    <h2>On y va, <span>${escapeHtml(name)}.</span></h2>
    <div class="summary">
      <div class="stat"><strong>${calories}</strong><small>kcal repères</small></div>
      <div class="stat"><strong>${carbs} g</strong><small>glucides ciblés</small></div>
      <div class="stat"><strong>${hydration} ml</strong><small>par heure</small></div>
    </div>
    <div class="nutrition-cards">
      <article class="nutrition-card"><span class="card-icon">↗</span><div><h3>Avant l'effort</h3><p>Une base de glucides faciles à digérer, 1 à 2 h avant.</p></div><strong>${Math.round(carbs * .35)} g</strong></article>
      <article class="nutrition-card"><span class="card-icon">◌</span><div><h3>Pendant</h3><p>Fractionnez votre apport et buvez régulièrement.</p></div><strong>${hydration} ml/h</strong></article>
      <article class="nutrition-card"><span class="card-icon">↙</span><div><h3>Récupération</h3><p>Glucides + protéines ${recovery} pour reconstruire.</p></div><strong>${protein} g</strong></article>
    </div>
    <div class="result-note">Une gourde de 750 ml, une banane et une compote sans fibres : le trio simple à préparer.</div>
  </div>`;
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
