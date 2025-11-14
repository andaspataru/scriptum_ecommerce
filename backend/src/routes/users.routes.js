import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const repo = () => AppDataSource.getRepository('User');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function min14(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  const min = new Date(t.getFullYear() - 14, t.getMonth(), t.getDate());
  return d <= min;
}

router.get('/me', requireAuth, async (req, res) => {
  const me = await repo().findOneBy({ id: req.user.id });
  if (!me) return res.status(404).json({ error: 'Utilizator inexistent.' });
  res.json({
    id: me.id,
    email: me.email,
    name: me.name,
    role: me.role,
    phoneNumber: me.phoneNumber,
    judet: me.judet,
    localitate: me.localitate,
    strada: me.strada,
    numar: me.numar,
    bloc: me.bloc,
    scara: me.scara,
    etaj: me.etaj,
    apartament: me.apartament,
    codPostal: me.codPostal,
    birthDate: me.birthDate,
  });
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = [
      'email', 'name', 'birthDate', 'phoneNumber',
      'judet', 'localitate', 'strada', 'numar', 'bloc', 'scara', 'etaj', 'apartament', 'codPostal',
    ];
    const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    if (payload.email) {
      const emailNorm = String(payload.email).trim().toLowerCase();
      if (!EMAIL_RE.test(emailNorm)) return res.status(400).json({ error: 'Email invalid.' });
      const exists = await repo().findOne({ where: { email: emailNorm } });
      if (exists && exists.id !== req.user.id) return res.status(409).json({ error: 'Email deja folosit.' });
      payload.email = emailNorm;
    }

    if (payload.birthDate && !min14(payload.birthDate)) {
      return res.status(400).json({ error: 'Trebuie să ai cel puțin 14 ani.' });
    }

    if (payload.phoneNumber) {
      const re = /^(\+?4?0)?7\d{8}$/;
      if (!re.test(String(payload.phoneNumber).replace(/\s|-/g, ''))) {
        return res.status(400).json({ error: 'Număr de telefon invalid.' });
      }
    }

    await repo().update({ id: req.user.id }, payload);
    const updated = await repo().findOneBy({ id: req.user.id });

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      phoneNumber: updated.phoneNumber,
      judet: updated.judet,
      localitate: updated.localitate,
      strada: updated.strada,
      numar: updated.numar,
      bloc: updated.bloc,
      scara: updated.scara,
      etaj: updated.etaj,
      apartament: updated.apartament,
      codPostal: updated.codPostal,
      birthDate: updated.birthDate,
    });
  } catch (err) {
    const msg = String(err?.message || '');
    console.error('[users.me PUT] ERROR', { message: err?.message, code: err?.code });
    if (msg.includes('ORA-00001')) return res.status(409).json({ error: 'Email deja folosit.' });
    return res.status(500).json({ error: 'Eroare la actualizarea profilului.' });
  }
});

router.delete('/me', requireAuth, async (req, res) => {
  try {
    await repo().delete({ id: req.user.id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[users.me DELETE] ERROR', err);
    return res.status(500).json({ error: 'Eroare la ștergerea contului.' });
  }
});

export default router;
