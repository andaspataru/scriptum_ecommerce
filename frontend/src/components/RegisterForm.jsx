import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';

export default function RegisterForm({ onSwitchToLogin, onRegisteredSuccess }) {
  const register = useStore((s) => s.register);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');

  const [judet, setJudet] = useState('');
  const [localitate, setLocalitate] = useState('');
  const [strada, setStrada] = useState('');
  const [numar, setNumar] = useState('');
  const [bloc, setBloc] = useState('');
  const [scara, setScara] = useState('');
  const [etaj, setEtaj] = useState('');
  const [apartament, setApartament] = useState('');
  const [codPostal, setCodPostal] = useState('');

  const [judete, setJudete] = useState([]);
  const [localitati, setLocalitati] = useState([]);
  const [judeteLoading, setJudeteLoading] = useState(false);
  const [localitatiLoading, setLocalitatiLoading] = useState(false);

  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setJudeteLoading(true);
    fetch('/api/geo/judete')
      .then((r) => r.json())
      .then((data) => setJudete(data || []))
      .catch((e) => console.error('geo/judete error', e))
      .finally(() => setJudeteLoading(false));
  }, []);

  useEffect(() => {
    if (!judet) {
      setLocalitati([]);
      setLocalitate('');
      return;
    }
    setLocalitatiLoading(true);
    fetch(`/api/geo/localitati?judet=${encodeURIComponent(judet)}`)
      .then((r) => r.json())
      .then((data) => setLocalitati(data || []))
      .catch((e) => console.error('geo/localitati error', e))
      .finally(() => setLocalitatiLoading(false));
  }, [judet]);

  useEffect(() => {
    const found = localitati.find((l) => l.value === localitate);
    if (found?.zip) setCodPostal(found.zip);
  }, [localitate, localitati]);

  function validateBirthDate(dateStr) {
    if (!dateStr) return false;
    const birth = new Date(dateStr);
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    return birth <= minAgeDate;
  }
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validatePassword(v) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v); }
  function validatePhone(p) {
    const re = /^(\+?4?0)?7\d{8}$/;
    return re.test(String(p).replace(/\s|-/g, ''));
  }

  const maxBirth = useMemo(
    () => new Date(new Date().setFullYear(new Date().getFullYear() - 14)).toISOString().split('T')[0],
    []
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!validateEmail(email)) return setErr('Emailul nu are format valid.');
    if (!validatePassword(password)) return setErr('Parola trebuie să aibă minim 8 caractere, o literă mare, o literă mică, un număr și un caracter special.');
    if (!validateBirthDate(birthDate)) return setErr('Trebuie să ai cel puțin 14 ani.');
    if (!validatePhone(phone)) return setErr('Numărul de telefon nu pare valid (ex: 07xxxxxxxx sau +407xxxxxxxx).');

    if (!judet) return setErr('Selectează județul.');
    if (!localitate) return setErr('Selectează localitatea.');
    if (!strada.trim()) return setErr('Completează strada.');
    if (!numar.trim()) return setErr('Completează numărul.');
    if (!codPostal.trim()) return setErr('Completează codul poștal.');

    setSubmitting(true);
    try {
      const emailNorm = email.trim().toLowerCase();
      await register({
        email: emailNorm,
        name,
        password,
        birthDate,
        phoneNumber: phone,
        judet,
        localitate,
        strada,
        numar,
        bloc: bloc || undefined,
        scara: scara || undefined,
        etaj: etaj || undefined,
        apartament: apartament || undefined,
        codPostal,
      });
      setOk('Cont creat și autentificat cu succes!');
      if (typeof onRegisteredSuccess === 'function') onRegisteredSuccess();
    } catch (e) {
      setErr(e?.message || 'Înregistrare eșuată.');
      console.error('register error:', e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <h3 style={{ margin: 0 }}>Creează cont</h3>

        <div className="form-row">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" required />
        </div>

        <div className="form-row">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă" required />
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Număr de telefon" required />
        </div>

        <div>
          <label className="small" style={{ display: 'block', marginBottom: 6 }}>Data nașterii</label>
          <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required max={maxBirth} />
        </div>

        <div className="form-row">
          <div className={`select-wrap ${judeteLoading ? 'is-loading' : ''}`}>
            <select
              className="select"
              value={judet}
              onChange={(e) => { setJudet(e.target.value); setLocalitate(''); }}
              required
              disabled={judeteLoading}
              aria-label="Județ"
            >
              <option value="">{judeteLoading ? 'Se încarcă județele…' : 'Selectează județul'}</option>
              {judete.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className={`select-wrap ${localitatiLoading ? 'is-loading' : ''}`}>
            <select
              className="select"
              value={localitate}
              onChange={(e) => setLocalitate(e.target.value)}
              required
              disabled={!judet || localitatiLoading}
              aria-label="Localitate"
            >
              <option value="">
                {!judet ? 'Alege întâi județul' : (localitatiLoading ? 'Se încarcă localitățile…' : 'Selectează localitatea')}
              </option>
              {localitati.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <input className="input" value={strada} onChange={(e) => setStrada(e.target.value)} placeholder="Strada" required />
          <input className="input" value={numar} onChange={(e) => setNumar(e.target.value)} placeholder="Număr" required />
        </div>

        <div className="form-row">
          <input className="input" value={bloc} onChange={(e) => setBloc(e.target.value)} placeholder="Bloc (opțional)" />
          <input className="input" value={scara} onChange={(e) => setScara(e.target.value)} placeholder="Scara (opțional)" />
        </div>

        <div className="form-row">
          <input className="input" value={etaj} onChange={(e) => setEtaj(e.target.value)} placeholder="Etaj (opțional)" />
          <input className="input" value={apartament} onChange={(e) => setApartament(e.target.value)} placeholder="Apartament (opțional)" />
        </div>

        <div>
          <input className="input" value={codPostal} onChange={(e) => setCodPostal(e.target.value)} placeholder="Cod poștal" required inputMode="numeric" />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" disabled={submitting}>
            {submitting ? 'Se creează…' : 'Creează cont'}
          </button>
          {err && <small style={{ color: 'var(--danger)' }}>{err}</small>}
          {ok && <small style={{ color: 'var(--ok)' }}>{ok}</small>}
        </div>
      </form>

      <div className="small" style={{ marginTop: 10, color: 'var(--muted)' }}>
        Ai deja cont?
        {' '}
        <button type="button" className="btn ghost" style={{ padding: '6px 10px', marginLeft: 6 }} onClick={onSwitchToLogin}>
          Autentifică-te
        </button>
      </div>
    </>
  );
}
