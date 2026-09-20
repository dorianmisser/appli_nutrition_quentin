import { Request, Response } from 'express';
import { Product } from '../models/Product';

/**
 * GET /api/products/:code
 * Récupère un produit sportif par son code-barres.
 */
export async function getProductByCode(req: Request, res: Response): Promise<void> {
  const { code } = req.params;

  const product = await Product.findOne({ code }).lean();
  if (!product) {
    res.status(404).json({ message: `Aucun produit trouvé pour le code ${code}.` });
    return;
  }

  res.json(product);
}

/**
 * GET /api/products?q=texte&category=en:sports-drinks&limit=20
 * Recherche parmi les produits déjà filtrés "sport" à l'import.
 */
export async function searchProducts(req: Request, res: Response): Promise<void> {
  const { q, category } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const filter: Record<string, unknown> = {};

  if (typeof q === 'string' && q.trim()) {
    filter.$text = { $search: q.trim() };
  }
  if (typeof category === 'string' && category.trim()) {
    filter.categoriesTags = category.trim();
  }

  const products = await Product.find(filter).limit(limit).lean();
  res.json({ count: products.length, results: products });
}
