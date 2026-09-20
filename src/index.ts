import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db';
import productsRouter from './routes/products.routes';

const PORT = process.env.PORT || 3000;

async function main(): Promise<void> {
  await connectDB();

  const app = express();
  app.use(express.json());

  app.use('/api/products', productsRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`API Planchette à l'écoute sur http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Échec du démarrage du serveur :', error);
  process.exit(1);
});
