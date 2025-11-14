import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';

export default function Profile() {
  const { user, updateProfile, deleteAccount } = useStore((s) => ({
    user: s.user,
    updateProfile: s.updateProfile,
    deleteAccount: s.deleteAccount,
  }));

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const desiredLocalitateRef = useRef(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.name || '');
      setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '');
      setPhone(user.phoneNumber || '');
      setJudet(user.judet || '');
      desiredLocalitateRef.current = user.localitate || '';
      setStrada(user.strada || '');
      setNumar(user.numar || '');
      setBloc(user.bloc || '');
      setScara(user.scara || '');
      setEtaj(user.etaj || '');
      setApartament(user.apartament || '');
      setCodPostal(user.codPostal || '');
    }
  }, [user]);

  useEffect(() => {
    setJudeteLoading(true);
    fetch('/api/geo/judete')
      .then((r) => r.json())
      .then((data) => setJudete(data || []))
      .catch((e) => console.error('geo/judete error', e))
      .finally(() => setJudeteLoading(false));;
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
      .then((data) => {
        setLocalitati(data || []);
        const wanted = desiredLocalitateRef.current;
        if (wanted) {
          const exists = (data || []).some((l) => l.value === wanted);
          if (exists) setLocalitate(wanted);
        }
        desiredLocalitateRef.current = null;
      })
      .catch((e) => console.error('geo/localitati error', e))
      .finally(() => setLocalitatiLoading(false));;
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
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function validatePhone(p) {
    const re = /^(\+?4?0)?7\d{8}$/;
    return re.test(p.replace(/\s|-/g, ''));
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
    if (!validateBirthDate(birthDate)) return setErr('Trebuie să ai cel puțin 14 ani.');
    if (!validatePhone(phone)) return setErr('Numărul de telefon nu pare valid.');
    if (!judet) return setErr('Selectează județul.');
    if (!localitate) return setErr('Selectează localitatea.');
    if (!strada.trim()) return setErr('Completează strada.');
    if (!numar.trim()) return setErr('Completează numărul.');
    if (!codPostal.trim()) return setErr('Completează codul poștal.');

    setLoading(true);
    try {
      await updateProfile({
        email: email.trim().toLowerCase(),
        name,
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
      setOk('Profil actualizat cu succes!');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm('Sigur vrei să ștergi contul? Această acțiune este ireversibilă.')) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch (e) {
      setErr(e.message || 'Ștergere eșuată.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <p>Trebuie să fii autentificat pentru a edita profilul.</p>;

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:12 }}>
    <h3 style={{margin:'4px 0'}}>Profilul meu</h3>

    <div className="form-row">
      <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required/>
      <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nume" required/>
    </div>

    <div className="form-row">
      <input className="input" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Telefon" required/>
      <input className="input" type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required max={maxBirth}/>
    </div>

    <div className="form-row">
      <select className="select" value={judet} onChange={(e)=>{ setJudet(e.target.value); setLocalitate(''); }} required>
        <option value="">Selectează județul</option>
        {judete.map((j)=><option key={j} value={j}>{j}</option>)}
      </select>
      <select className="select" value={localitate} onChange={(e)=>setLocalitate(e.target.value)} required disabled={!judet}>
        <option value="">Selectează localitatea</option>
        {localitati.map((l)=><option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
    </div>

    <div className="form-row">
      <input className="input" value={strada} onChange={(e)=>setStrada(e.target.value)} placeholder="Strada" required/>
      <input className="input" value={numar} onChange={(e)=>setNumar(e.target.value)} placeholder="Număr" required/>
    </div>

    <div className="form-row">
      <input className="input" value={bloc} onChange={(e)=>setBloc(e.target.value)} placeholder="Bloc (opțional)"/>
      <input className="input" value={scara} onChange={(e)=>setScara(e.target.value)} placeholder="Scara (opțional)"/>
    </div>

    <div className="form-row">
      <input className="input" value={etaj} onChange={(e)=>setEtaj(e.target.value)} placeholder="Etaj (opțional)"/>
      <input className="input" value={apartament} onChange={(e)=>setApartament(e.target.value)} placeholder="Apartament (opțional)"/>
    </div>

    <div className="form-row">
      <input className="input" value={codPostal} onChange={(e)=>setCodPostal(e.target.value)} placeholder="Cod poștal" required/>
      <div/>
    </div>

    <div style={{ display:'flex', gap:8 }}>
      <button className="btn" disabled={loading}>{loading ? 'Se salvează…' : 'Salvează modificările'}</button>
      <button type="button" className="btn danger" onClick={onDelete} disabled={loading}>Șterge contul</button>
    </div>

    {err && <small style={{ color: 'crimson' }}>{err}</small>}
    {ok && <small style={{ color: 'var(--ok)' }}>{ok}</small>}
  </form>
);
}
