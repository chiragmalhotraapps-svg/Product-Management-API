import express from 'express';
import productRoutes from './routes/products.js';
import { errorHandler } from './middleware/errorHandler.js';

export default function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/products', productRoutes);

  app.use(errorHandler);

  return app;
}
