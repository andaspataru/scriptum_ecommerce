import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const repo = () => AppDataSource.getRepository('Category');

router.get('/', async (_req, res) => res.json(await repo().find()));

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const cat = repo().create(req.body);
  res.json(await repo().save(cat));
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const cat = await repo().findOneBy({ id: Number(req.params.id) });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  repo().merge(cat, req.body);
  res.json(await repo().save(cat));
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const r = await repo().delete(Number(req.params.id));
  res.json({ affected: r.affected });
});

export default router;
