import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI manquant dans les variables d\'environnement.');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connecté.');

  mongoose.connection.on('error', (error) => {
    console.error('Erreur MongoDB :', error);
  });
}
