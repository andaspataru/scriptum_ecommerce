import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const productRepo = () => AppDataSource.getRepository('Product');
const catRepo = () => AppDataSource.getRepository('Category');


router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  const qb = productRepo().createQueryBuilder('p').leftJoinAndSelect('p.category', 'c'); 

  if (q) qb.andWhere('LOWER(p.title) LIKE :q', { q: `%${q}%` });

  const products = await qb.getMany(); 
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalid' });

  const product = await productRepo()
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.category', 'c') 
    .where('p.id = :id', { id })
    .getOne();

  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});


router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, price, stock, imageUrl, description, categoryId } = req.body;

  const category = categoryId ? await catRepo().findOneBy({ id: categoryId }) : null;

  const prod = productRepo().create({
    title,
    price,
    stock,
    imageUrl,
    description, 
    category: category ?? null,
  });

  const saved = await productRepo().save(prod);
  res.status(201).json(saved);
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const prod = await productRepo().findOne({ where: { id } });
  if (!prod) return res.status(404).json({ error: 'Not found' });

  const { categoryId, ...rest } = req.body;

  if (categoryId !== undefined) {
    prod.category = (await catRepo().findOneBy({ id: categoryId })) ?? null;
  }

  Object.assign(prod, rest); 
  const saved = await productRepo().save(prod);
  res.json(saved);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const r = await productRepo().delete(id);
  res.json({ affected: r.affected });
});

export default router;
