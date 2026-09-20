/**
 * Import filtré du dump Open Food Facts (export TSV) vers MongoDB.
 *
 * Ne conserve que les produits dont categories_tags recoupe SPORT_CATEGORY_TAGS,
 * et ne garde que les colonnes utiles à Planchette (voir Product.ts).
 *
 * Usage :
 *   MONGODB_URI="mongodb://localhost:27017/planchette" \
 *   npx ts-node scripts/importOpenFoodFacts.ts /chemin/vers/en.openfoodfacts.org.products.tsv
 *
 * Le fichier source est un TSV UTF-8 (voir nutrition_bdd_data_fields.txt) : on le lit
 * en streaming ligne par ligne pour rester utilisable même sur l'export complet (plusieurs Go).
 */
import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import { Product } from '../src/models/Product';
import { isSportProduct } from '../src/config/sportCategories';

const BATCH_SIZE = 500;

// Colonnes du TSV qu'on va effectivement utiliser (voir nutrition_bdd_data_fields.txt)
const REQUIRED_COLUMNS = [
  'code',
  'product_name',
  'brands_tags',
  'categories_tags',
  'nutrition_grade_fr',
  'serving_size',
  'image_url',
  'energy-kcal_100g',
  'proteins_100g',
  'carbohydrates_100g',
  'sugars_100g',
  'fat_100g',
  'sodium_100g',
] as const;

type ColumnIndex = Record<string, number>;

function splitTagsField(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildColumnIndex(headerLine: string): ColumnIndex {
  const headers = headerLine.split('\t');
  const index: ColumnIndex = {};
  for (const col of REQUIRED_COLUMNS) {
    const pos = headers.indexOf(col);
    if (pos === -1) {
      console.warn(`⚠️  Colonne "${col}" absente du fichier source — champ ignoré à l'import.`);
    }
    index[col] = pos;
  }
  return index;
}

function getField(row: string[], columnIndex: ColumnIndex, column: string): string | undefined {
  const pos = columnIndex[column];
  if (pos === undefined || pos === -1) return undefined;
  return row[pos];
}

async function run(filePath: string, mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);
  console.log('Connecté à MongoDB.');

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let columnIndex: ColumnIndex | null = null;
  let batch: mongoose.AnyBulkWriteOperation[] = [];
  let seenLines = 0;
  let matchedProducts = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await Product.bulkWrite(batch, { ordered: false });
    batch = [];
  };

  for await (const line of rl) {
    if (!columnIndex) {
      columnIndex = buildColumnIndex(line);
      continue; // ligne d'en-tête
    }

    seenLines += 1;
    const row = line.split('\t');

    const code = getField(row, columnIndex, 'code');
    if (!code) continue;

    const categoriesTags = splitTagsField(getField(row, columnIndex, 'categories_tags'));
    if (!isSportProduct(categoriesTags)) continue;

    matchedProducts += 1;

    batch.push({
      updateOne: {
        filter: { code },
        update: {
          $set: {
            code,
            productName: getField(row, columnIndex, 'product_name') || undefined,
            brands: splitTagsField(getField(row, columnIndex, 'brands_tags')),
            categoriesTags,
            nutritionGradeFr: getField(row, columnIndex, 'nutrition_grade_fr') || undefined,
            servingSize: getField(row, columnIndex, 'serving_size') || undefined,
            imageUrl: getField(row, columnIndex, 'image_url') || undefined,
            nutriments: {
              energyKcal100g: toNumberOrUndefined(getField(row, columnIndex, 'energy-kcal_100g')),
              proteins100g: toNumberOrUndefined(getField(row, columnIndex, 'proteins_100g')),
              carbohydrates100g: toNumberOrUndefined(getField(row, columnIndex, 'carbohydrates_100g')),
              sugars100g: toNumberOrUndefined(getField(row, columnIndex, 'sugars_100g')),
              fat100g: toNumberOrUndefined(getField(row, columnIndex, 'fat_100g')),
              sodium100g: toNumberOrUndefined(getField(row, columnIndex, 'sodium_100g')),
            },
          },
        },
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      console.log(`... ${seenLines} lignes lues, ${matchedProducts} produits sportifs importés`);
    }
  }

  await flushBatch();
  console.log(`Terminé. ${seenLines} lignes lues, ${matchedProducts} produits sportifs importés.`);

  await mongoose.disconnect();
}

const [, , filePathArg] = process.argv;
const mongoUri = process.env.MONGODB_URI;

if (!filePathArg) {
  console.error('Usage: npx ts-node scripts/importOpenFoodFacts.ts <chemin_vers_export.tsv>');
  process.exit(1);
}
if (!mongoUri) {
  console.error('Variable d\'environnement MONGODB_URI manquante.');
  process.exit(1);
}

run(filePathArg, mongoUri).catch((error) => {
  console.error('Échec de l\'import :', error);
  process.exit(1);
});
