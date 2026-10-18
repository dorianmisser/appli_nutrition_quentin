import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { DEFAULT_PROFILE } from '../data/sample';
import { productTypeLabels } from '../domain/labels';
import type { Product, ProductType } from '../domain/types';
import { useStored } from '../hooks/useStored';
import { rememberProduct, resolveProducts, searchProducts } from '../services/products';
import { profileStore } from '../services/storage';

const TYPES = Object.keys(productTypeLabels) as ProductType[];

function ProductRow({ product, favorite, onToggle }: { product: Product; favorite: boolean; onToggle: () => void }) {
  return (
    <li className="product">
      <div className="product__main">
        <span className={`product__type product__type--${product.type}`}>{productTypeLabels[product.type]}</span>
        <h3>{product.name}</h3>
        <p className="muted">
          {product.brand ? `${product.brand}, ` : ''}{product.servingLabel}
          {product.source === 'catalogue' && ' (valeurs génériques)'}
        </p>
      </div>
      <dl className="product__facts">
        <div><dt>Glucides</dt><dd>{product.carbsG} g</dd></div>
        <div><dt>Sodium</dt><dd>{product.sodiumMg} mg</dd></div>
        {product.caffeineMg > 0 && <div><dt>Caféine</dt><dd>{product.caffeineMg} mg</dd></div>}
      </dl>
      <button
        type="button"
        className={favorite ? 'icon-button is-on' : 'icon-button'}
        onClick={onToggle}
        aria-pressed={favorite}
        aria-label={favorite ? `Retirer ${product.name} de mes produits` : `Ajouter ${product.name} à mes produits`}
      >
        <Icon name={favorite ? 'starFilled' : 'star'} />
      </button>
    </li>
  );
}

export function ProductsPage() {
  const profile = useStored(profileStore.get) ?? DEFAULT_PROFILE;
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ProductType | ''>('');
  const [results, setResults] = useState<Product[]>([]);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const favorites = useMemo(() => resolveProducts(profile.favoriteProductIds), [profile.favoriteProductIds]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchProducts(query, type || undefined, controller.signal)
        .then((r) => {
          setResults(r.products);
          setApiAvailable(r.apiAvailable);
          setLoading(false);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, type]);

  const toggle = (product: Product) => {
    const ids = profile.favoriteProductIds;
    const next = ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id];
    rememberProduct(product);
    profileStore.save({ ...profile, favoriteProductIds: next });
  };

  return (
    <section className="page">
      <header className="page__head">
        <h1>Produits</h1>
        <p>Les produits marqués d'une étoile sont ceux que vos plans utilisent.</p>
      </header>

      <section className="pantry" aria-labelledby="mes-produits">
        <h2 id="mes-produits">Mes produits <span className="count">{favorites.length}</span></h2>
        {favorites.length === 0 ? (
          <p className="muted">Aucun produit choisi. Ajoutez au moins une boisson et un gel ou une barre.</p>
        ) : (
          <ul className="products">
            {favorites.map((p) => <ProductRow key={p.id} product={p} favorite onToggle={() => toggle(p)} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="catalogue">
        <h2 id="catalogue">Catalogue</h2>
        <div className="filters">
          <label className="field field--search">
            <span className="visually-hidden">Rechercher un produit</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher : gel, boisson, barre…" />
          </label>
          <div className="chips" role="group" aria-label="Filtrer par type">
            <button type="button" className={type === '' ? 'chip-button is-on' : 'chip-button'} onClick={() => setType('')}>Tous</button>
            {TYPES.map((t) => (
              <button key={t} type="button" className={type === t ? 'chip-button is-on' : 'chip-button'} onClick={() => setType(t)}>
                {productTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>
        {apiAvailable === false && (
          <p className="notice">La base produits Open Food Facts ne répond pas : seul le catalogue générique est affiché. Lancez l'API pour y accéder.</p>
        )}
        {loading && results.length === 0 ? (
          <p className="muted">Chargement des produits…</p>
        ) : results.length === 0 ? (
          <p className="muted">Aucun produit ne correspond à « {query} ». Essayez un terme plus court.</p>
        ) : (
          <ul className="products">
            {results.map((p) => (
              <ProductRow key={p.id} product={p} favorite={profile.favoriteProductIds.includes(p.id)} onToggle={() => toggle(p)} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
