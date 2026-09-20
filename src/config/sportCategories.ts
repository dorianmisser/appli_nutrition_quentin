/**
 * Tags OFF (categories_tags) considérés comme "consommation sportive".
 *
 * ⚠️ À vérifier/compléter avant l'import de production : ces slugs sont les plus
 * courants dans la taxonomie Open Food Facts, mais la taxonomie évolue.
 * Vérifier la liste à jour sur https://world.openfoodfacts.org/categories
 * (ou le fichier categories.txt de la taxonomie OFF) et ajuster ici.
 */
export const SPORT_CATEGORY_TAGS: readonly string[] = [
  // Boissons de l'effort
  'en:sports-drinks',
  'fr:boissons-pour-sportifs',
  'fr:boissons-de-l-effort',
  'en:isotonic-drinks',
  'fr:boissons-isotoniques',
  'en:recovery-drinks',

  // Barres et gels énergétiques
  'en:energy-bars',
  'fr:barres-energetiques',
  'en:protein-bars',
  'fr:barres-proteinees',
  'en:energy-gels',
  'fr:gels-energetiques',

  // Compléments alimentaires liés à l'effort
  'en:dietary-supplements',
  'fr:complements-alimentaires',
  'en:protein-supplements',
  'fr:proteines-en-poudre',
  'en:amino-acids',
  'fr:acides-amines',

  // Préparations spécifiques sportifs
  'fr:preparations-pour-sportifs',
  'en:meal-replacement',
] as const;

const SPORT_TAGS_SET = new Set(SPORT_CATEGORY_TAGS);

/**
 * Un produit est retenu s'il porte au moins un tag de la liste ci-dessus
 * dans son champ categories_tags (liste déjà normalisée/hiérarchisée par OFF).
 */
export function isSportProduct(categoriesTags: string[]): boolean {
  return categoriesTags.some((tag) => SPORT_TAGS_SET.has(tag.trim().toLowerCase()));
}
