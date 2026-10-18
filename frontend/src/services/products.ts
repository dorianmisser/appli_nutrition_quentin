import { CATALOGUE } from '../data/catalogue';
import type { Product, ProductType } from '../domain/types';

/** Forme d'un produit renvoyé par GET /api/products (modèle Mongoose src/models/Product.ts). */
interface ApiProduct {
  code: string;
  productName?: string;
  brands?: string[];
  categoriesTags?: string[];
  servingSize?: string;
  imageUrl?: string;
  nutriments?: {
    carbohydrates100g?: number;
    sodium100g?: number;
    proteins100g?: number;
    caffeine100g?: number;
  };
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const TYPE_BY_TAG: [RegExp, ProductType][] = [
  [/gel/, 'gel'],
  [/recovery|recuperation|protein|proteine/, 'recovery'],
  [/drink|boisson|isotoni/, 'drink'],
  [/bar|barre/, 'bar'],
  [/salt|electrolyt|sel/, 'electrolyte'],
];

const DEFAULT_SERVING: Record<ProductType, { amount: number; unit: 'g' | 'ml' }> = {
  gel: { amount: 40, unit: 'g' },
  bar: { amount: 50, unit: 'g' },
  chew: { amount: 30, unit: 'g' },
  drink: { amount: 500, unit: 'ml' },
  food: { amount: 50, unit: 'g' },
  electrolyte: { amount: 1, unit: 'g' },
  recovery: { amount: 50, unit: 'g' },
};

export function productTypeFromTags(tags: string[] = []): ProductType {
  for (const [pattern, type] of TYPE_BY_TAG) if (tags.some((t) => pattern.test(t))) return type;
  return 'food';
}

/** Lit « 500 ml », « 40g », « 2 x 25 cl »… et renvoie une quantité en g ou ml. */
export function parseServing(text: string | undefined): { amount: number; unit: 'g' | 'ml' } | null {
  if (!text) return null;
  const match = text.toLowerCase().replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 'kg') return { amount: value * 1000, unit: 'g' };
  if (unit === 'g') return { amount: value, unit: 'g' };
  if (unit === 'cl') return { amount: value * 10, unit: 'ml' };
  if (unit === 'l') return { amount: value * 1000, unit: 'ml' };
  return { amount: value, unit: 'ml' };
}

export function fromApi(api: ApiProduct): Product {
  const type = productTypeFromTags(api.categoriesTags);
  const serving = parseServing(api.servingSize) ?? DEFAULT_SERVING[type];
  const per100 = (value?: number) => ((value ?? 0) * serving.amount) / 100;
  return {
    id: `off-${api.code}`,
    name: api.productName?.trim() || `Produit ${api.code}`,
    brand: api.brands?.[0]?.replace(/-/g, ' '),
    type,
    servingLabel: `${serving.amount} ${serving.unit}`,
    carbsG: Math.round(per100(api.nutriments?.carbohydrates100g)),
    sodiumMg: Math.round(per100(api.nutriments?.sodium100g) * 1000),
    // La caféine n'est pas encore importée depuis Open Food Facts (champ caffeine_100g) : 0 par défaut.
    caffeineMg: Math.round(per100(api.nutriments?.caffeine100g) * 1000),
    fluidMl: type === 'drink' && serving.unit === 'ml' ? serving.amount : 0,
    proteinG: Math.round(per100(api.nutriments?.proteins100g)),
    tastes: [],
    source: 'api',
    imageUrl: api.imageUrl,
  };
}

export interface ProductSearch {
  products: Product[];
  apiAvailable: boolean;
}

function searchCatalogue(query: string, type?: ProductType): Product[] {
  const q = query.trim().toLowerCase();
  return CATALOGUE.filter((p) => (!type || p.type === type) && (!q || p.name.toLowerCase().includes(q)));
}

export async function searchProducts(query: string, type?: ProductType, signal?: AbortSignal): Promise<ProductSearch> {
  const local = searchCatalogue(query, type);
  try {
    const params = new URLSearchParams({ limit: '40' });
    if (query.trim()) params.set('q', query.trim());
    const response = await fetch(`${API_BASE}/api/products?${params}`, { signal });
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as { results: ApiProduct[] };
    const remote = body.results.map(fromApi).filter((p) => !type || p.type === type);
    remote.forEach(rememberProduct);
    return { products: [...local, ...remote], apiAvailable: true };
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    return { products: local, apiAvailable: false };
  }
}

// Les produits de l'API mis en favoris sont gardés en local pour construire un plan hors ligne.
const CACHE_KEY = 'chtri:product-cache';

function readCache(): Record<string, Product> {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, Product>;
  } catch {
    return {};
  }
}

export function rememberProduct(product: Product): void {
  if (product.source !== 'api') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [product.id]: product }));
  } catch {
    /* stockage indisponible */
  }
}

export function resolveProducts(ids: string[]): Product[] {
  const cache = readCache();
  return ids
    .map((id) => CATALOGUE.find((p) => p.id === id) ?? cache[id])
    .filter((p): p is Product => Boolean(p));
}

export function findProduct(id: string): Product | undefined {
  return resolveProducts([id])[0];
}
