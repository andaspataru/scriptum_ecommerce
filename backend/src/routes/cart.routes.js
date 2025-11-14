import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';

import { requireAuth } from '../middleware/auth.js';

const router = Router();
const cartRepo = () => AppDataSource.getRepository('Cart');
const itemRepo = () => AppDataSource.getRepository('CartItem');
const productRepo = () => AppDataSource.getRepository('Product');

async function getOrCreateActiveCart(userId) {
  let cart = await cartRepo().findOne({
    where: { user: { id: userId } },
    relations: { items: true }
  });
  if (!cart) {
    cart = cartRepo().create({ user: { id: userId }, items: [] });
    cart = await cartRepo().save(cart);
  }
  return cart;
}

router.get('/', requireAuth, async (req, res) => {
  const cart = await getOrCreateActiveCart(req.user.id);
  const full = await cartRepo().findOne({ where: { id: cart.id }, relations: { items: { product: true } } });
  res.json(full);
});

router.post('/items', requireAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const prod = await productRepo().findOneBy({ id: productId });
  if (!prod) return res.status(404).json({ error: 'Produs inexistent' });
  if (quantity <= 0) return res.status(400).json({ error: 'Cantitate invalidă' });

  const cart = await getOrCreateActiveCart(req.user.id);
  let item = await itemRepo().findOne({ where: { cart: { id: cart.id }, product: { id: prod.id } } });
  if (item) {
    item.quantity += quantity;
  } else {
    item = itemRepo().create({ cart, product: prod, quantity });
  }
  await itemRepo().save(item);
  const full = await cartRepo().findOne({ where: { id: cart.id }, relations: { items: { product: true } } });
  res.json(full);
});

router.put('/items/:itemId', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  const item = await itemRepo().findOne({ where: { id: Number(req.params.itemId) }, relations: { cart: true } });
  if (!item) return res.status(404).json({ error: 'Item inexistent' });
  if (quantity <= 0) {
    await itemRepo().delete(item.id);
  } else {
    item.quantity = quantity;
    await itemRepo().save(item);
  }
  const full = await cartRepo().findOne({ where: { id: item.cart.id }, relations: { items: { product: true } } });
  res.json(full);
});

router.delete('/items/:itemId', requireAuth, async (req, res) => {
  await itemRepo().delete(Number(req.params.itemId));
  res.json({ ok: true });
});

export default router;
