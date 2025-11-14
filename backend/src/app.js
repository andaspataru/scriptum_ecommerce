// backend/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import productMediaRoutes from './routes/product.media.routes.js';
import cartRoutes from './routes/cart.routes.js';
import ratesRoutes from './routes/rates.routes.js';
import geoRoutes from './routes/geo.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import usersRouter from './routes/users.routes.js';

const app = express();
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cors({
  origin: true,         
  credentials: true,       
}));
app.use(express.json({ limit: '2mb' })); 

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/public', express.static(path.join(process.cwd(), 'public'), {
  fallthrough: true,
  maxAge: '7d',
}));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/products', productMediaRoutes);

app.use('/api/products', productRoutes);

app.use('/api/cart', cartRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRoutes);
app.use('/api/geo', geoRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || 'Eroare server' });
});

export default app;
