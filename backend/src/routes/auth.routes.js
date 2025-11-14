import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const repo = () => AppDataSource.getRepository('User');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/register', async (req, res) => {
  try {
    const body =
      req.body && typeof req.body.email === 'object' && req.body.email !== null && !Array.isArray(req.body.email)
        ? req.body.email
        : (req.body || {});

    const {
      email, name, password, birthDate,
      phoneNumber, judet, localitate, strada, numar,
      bloc, scara, etaj, apartament, codPostal,
    } = body;

    const emailNorm =
      typeof email === 'string' && EMAIL_RE.test(email.trim().toLowerCase())
        ? email.trim().toLowerCase()
        : null;

    if (!emailNorm) return res.status(400).json({ error: 'Email invalid.' });
    if (!password)  return res.status(400).json({ error: 'Parolă lipsă.' });
    if (!birthDate) return res.status(400).json({ error: 'Data nașterii lipsă.' });

    const exists = await repo().findOneBy({ email: emailNorm });
    if (exists) return res.status(409).json({ error: 'Email deja folosit.' });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = repo().create({
      email: emailNorm,
      name,
      passwordHash,
      role: 'customer',
      birthDate: new Date(birthDate),
      phoneNumber,
      judet, localitate, strada, numar,
      bloc, scara, etaj, apartament,
      codPostal,
    });

    await repo().save(user);

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber,
      judet: user.judet,
      localitate: user.localitate,
      strada: user.strada,
      numar: user.numar,
      bloc: user.bloc,
      scara: user.scara,
      etaj: user.etaj,
      apartament: user.apartament,
      codPostal: user.codPostal,
      birthDate: user.birthDate,
    });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('ORA-00001')) return res.status(409).json({ error: 'Email deja folosit.' });
    return res.status(500).json({ error: 'Eroare server la înregistrare.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body =
      req.body && typeof req.body.email === 'object' && req.body.email !== null && !Array.isArray(req.body.email)
        ? req.body.email
        : (req.body || {});

    const emailStr = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const emailNorm = EMAIL_RE.test(emailStr) ? emailStr : null;
    const password = body.password;

    if (!emailNorm || !password) {
      return res.status(400).json({ error: 'Email sau parolă lipsă.' });
    }

    const user = await repo().findOneBy({ email: emailNorm });
    if (!user) return res.status(401).json({ error: 'Credențiale invalide' });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credențiale invalide' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '2h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        judet: user.judet,
        localitate: user.localitate,
        strada: user.strada,
        numar: user.numar,
        bloc: user.bloc,
        scara: user.scara,
        etaj: user.etaj,
        apartament: user.apartament,
        codPostal: user.codPostal,
        birthDate: user.birthDate,
      },
    });
  } catch (err) {
    console.error('[login] ERROR', err);
    res.status(500).json({ error: 'Eroare server la autentificare.' });
  }
});

export default router;
