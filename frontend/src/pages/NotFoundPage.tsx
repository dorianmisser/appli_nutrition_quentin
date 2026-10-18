import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="empty">
      <h1>Cette page n'existe pas</h1>
      <p>Le lien est peut-être ancien, ou le plan a été supprimé.</p>
      <Link className="button button--primary" to="/">Revenir à l'accueil</Link>
    </section>
  );
}
