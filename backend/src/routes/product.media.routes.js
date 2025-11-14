import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { AppDataSource } from '../config/data-source.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

await fs.mkdir(IMAGES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${safe}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|gif|bmp|svg\+xml)/i.test(file.mimetype);
    cb(ok ? null : new Error('Tip de fișier invalid'), ok);
  },
});

function toPublicRel(fullPath) {
  const relFromPublic = path.relative(PUBLIC_DIR, fullPath).replaceAll(path.sep, '/'); 
  const cleaned = relFromPublic.replace(/^public\//i, '');
  const ensured = cleaned.startsWith('images/') ? cleaned : `images/${cleaned.replace(/^\/+/, '')}`;
  return `/${ensured}`;
}

router.get('/__media-ping', (_req, res) => res.json({ ok: true }));

router.get('/:id(\\d+)/media', async (req, res) => {
  const id = Number(req.params.id);
  const prod = await AppDataSource.getRepository('Product').findOne({ where: { id } });
  if (!prod) return res.status(404).json({ error: 'Produs inexistent' });

  const imgs = await AppDataSource.getRepository('ProductImage').find({
    where: { productId: id },
    order: { id: 'ASC' },
  });

  res.json({
    cover: prod.imageUrl || null, 
    images: imgs.map((i) => ({ id: i.id, url: i.url, alt: i.alt })), 
    description: prod.description ?? '',
  });
});

router.post('/:id(\\d+)/cover', requireAuth, requireAdmin, upload.single('cover'), async (req, res) => {
  const id = Number(req.params.id);
  const prodRepo = AppDataSource.getRepository('Product');
  const prod = await prodRepo.findOne({ where: { id } });
  if (!prod) return res.status(404).json({ error: 'Produs inexistent' });

  if (!req.file) return res.status(400).json({ error: 'Fișier lipsă (cover)' });

  try {
    if (prod.imageUrl && !/^https?:\/\//i.test(prod.imageUrl)) {
      const rel = prod.imageUrl.replace(/^\/+/, '');   
      const abs = path.join(PUBLIC_DIR, rel);            
      await fs.unlink(abs).catch(() => {});
    }
  } catch {}

  const relUrl = toPublicRel(req.file.path); 
  prod.imageUrl = relUrl;
  await prodRepo.save(prod);

  res.status(201).json({ cover: relUrl });
});


router.post('/:id(\\d+)/images', requireAuth, requireAdmin, upload.array('images', 12), async (req, res) => {
  const id = Number(req.params.id);
  const prod = await AppDataSource.getRepository('Product').findOne({ where: { id } });
  if (!prod) return res.status(404).json({ error: 'Produs inexistent' });

  const imagesRepo = AppDataSource.getRepository('ProductImage');

  const alts = (() => {
    try {
      if (req.body?.alts) return JSON.parse(req.body.alts);
    } catch {}
    return [];
  })();

  const created = [];
  for (let i = 0; i < (req.files?.length || 0); i++) {
    const f = req.files[i];
    const relUrl = toPublicRel(f.path); 
    const alt = typeof alts[i] === 'string' ? alts[i] : null;

    const rec = imagesRepo.create({ productId: id, url: relUrl, alt });
    const saved = await imagesRepo.save(rec);
    created.push({ id: saved.id, url: saved.url, alt: saved.alt });
  }

  res.status(201).json({ images: created });
});


router.delete('/images/:imageId(\\d+)', requireAuth, requireAdmin, async (req, res) => {
  const imageId = Number(req.params.imageId);
  const repo = AppDataSource.getRepository('ProductImage');
  const img = await repo.findOne({ where: { id: imageId } });
  if (!img) return res.status(404).json({ error: 'Imagine inexistentă' });


  try {
    if (img.url && !/^https?:\/\//i.test(img.url)) {
      const rel = img.url.replace(/^\/+/, '');    
      const abs = path.join(PUBLIC_DIR, rel);     
      await fs.unlink(abs).catch(() => {});
    }
  } catch {}

  await repo.delete({ id: imageId });
  res.json({ ok: true });
});

router.put('/images/:imageId(\\d+)', requireAuth, requireAdmin, async (req, res) => {
  const imageId = Number(req.params.imageId);
  const { alt } = req.body || {};
  const repo = AppDataSource.getRepository('ProductImage');
  const img = await repo.findOne({ where: { id: imageId } });
  if (!img) return res.status(404).json({ error: 'Imagine inexistentă' });

  img.alt = (typeof alt === 'string' && alt.trim()) || null;
  const saved = await repo.save(img);
  res.json({ id: saved.id, url: saved.url, alt: saved.alt });
});

export default router;
