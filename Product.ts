import { Schema, model, Document, Types } from 'mongoose';

/**
 * Sous-ensemble des champs Open Food Facts retenus pour Planchette.
 * Voir nutrition_bdd_data_fields.txt pour la définition complète des champs source.
 */
export interface INutriments {
  energyKcal100g?: number;   // energy-kcal_100g
  proteins100g?: number;     // proteins_100g
  carbohydrates100g?: number;// carbohydrates_100g
  sugars100g?: number;       // sugars_100g
  fat100g?: number;          // fat_100g
  sodium100g?: number;       // sodium_100g
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  code: string;              // code (barcode) — clé métier unique
  productName?: string;      // product_name
  brands?: string[];         // brands_tags
  categoriesTags: string[];  // categories_tags — utilisé pour le filtre sportif à l'import
  nutritionGradeFr?: string; // nutrition_grade_fr ('a' à 'e')
  servingSize?: string;      // serving_size (texte brut, ex: "500 ml")
  imageUrl?: string;         // image_url
  nutriments: INutriments;
  createdAt: Date;
  updatedAt: Date;
}

const NutrimentsSchema = new Schema<INutriments>(
  {
    energyKcal100g: { type: Number, min: 0 },
    proteins100g: { type: Number, min: 0 },
    carbohydrates100g: { type: Number, min: 0 },
    sugars100g: { type: Number, min: 0 },
    fat100g: { type: Number, min: 0 },
    sodium100g: { type: Number, min: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    productName: { type: String, trim: true },
    brands: { type: [String], default: [] },
    categoriesTags: { type: [String], default: [], index: true },
    nutritionGradeFr: { type: String, enum: ['a', 'b', 'c', 'd', 'e'], index: true },
    servingSize: { type: String },
    imageUrl: { type: String },
    nutriments: { type: NutrimentsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Recherche texte simple sur le nom produit (utile pour une future route /products/search)
ProductSchema.index({ productName: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
