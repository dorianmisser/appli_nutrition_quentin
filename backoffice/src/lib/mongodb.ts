import mongoose from "mongoose";

// Cache de la connexion pour éviter d'en ouvrir une nouvelle à chaque rechargement en dev.
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { _mongoose?: Cache };
const cache: Cache = (globalWithMongoose._mongoose ??= { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI manquant : copiez .env.example vers .env.local et renseignez l'URI."
    );
  }
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // permet de réessayer après un échec
    throw error;
  }
  return cache.conn;
}
