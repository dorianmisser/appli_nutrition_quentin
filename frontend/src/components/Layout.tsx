import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Icon, type IconName } from './Icon';

const links: { to: string; label: string; icon: IconName }[] = [
  { to: '/plan', label: 'Nouveau plan', icon: 'plan' },
  { to: '/produits', label: 'Produits', icon: 'pantry' },
  { to: '/historique', label: 'Historique', icon: 'history' },
  { to: '/profil', label: 'Profil', icon: 'profile' },
];

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  const inEffort = pathname.startsWith('/effort/');

  return (
    <div className={inEffort ? 'shell shell--effort' : 'shell'}>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="topbar">
        <NavLink to="/" className="topbar__brand" aria-label="CH'TRI COACHING, accueil">
          <img src="/logo.svg" alt="" width="132" height="81" />
        </NavLink>
        <nav className="topbar__nav" aria-label="Navigation principale">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="topbar__link">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="contenu" className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Repères indicatifs, issus des recommandations de nutrition du sport. Ils ne remplacent pas l'avis d'un médecin ou d'un diététicien.</p>
      </footer>
      <nav className="tabbar" aria-label="Navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="tabbar__link">
            <Icon name={link.icon} />
            <span>{link.label.replace('Nouveau plan', 'Plan')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
