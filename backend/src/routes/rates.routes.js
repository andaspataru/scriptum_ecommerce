import { Router } from 'express';
import { getRates } from '../services/rates.service.js';

const router = Router();

router.get('/', async (req, res) => {
  const base = typeof req.query.base === 'string' ? req.query.base : 'EUR';
  try {
    const data = await getRates(base);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e?.message });
  }
});

export default router;
