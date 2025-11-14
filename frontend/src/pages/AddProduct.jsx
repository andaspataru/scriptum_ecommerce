import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { api, getToken } from '../api';

export default function AddProduct({ setPage }) {
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      if (typeof setPage === 'function') setPage('home');
    }
  }, [user, setPage]);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [alts, setAlts] = useState([]);

  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCatsLoading(true);
    api('/categories')
      .then((d) => setCats(Array.isArray(d) ? d : []))
      .catch((e) => console.error('load categories error', e))
      .finally(() => setCatsLoading(false));
  }, []);

  const canSubmit = useMemo(() => {
    const p = Number(price);
    const s = Number(stock);
    return (
      title.trim().length >= 3 &&
      !Number.isNaN(p) && p >= 0 &&
      Number.isInteger(s) && s >= 0 &&
      coverFile instanceof File 
      //&& files.length > 0
    );
  }, [title, price, stock, coverFile, files.length]);

  function onSelectCover(e) {
    const f = e.target.files?.[0] || null;
    setCoverFile(f || null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(f ? URL.createObjectURL(f) : '');
  }
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview]
  );

  function onSelectFiles(e) {
    const list = Array.from(e.target.files || []).slice(0, 12);
    setFiles(list);
    setAlts((old) => {
      const arr = [...old];
      arr.length = list.length;
      return arr.map((v) => v || '');
    });
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }
  useEffect(
    () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
    [previews]
  );

  async function uploadCover(productId) {
    if (!(coverFile instanceof File)) throw new Error('Lipsește imaginea principală');
    const fd = new FormData();
    fd.append('cover', coverFile);
    const token = getToken();
    const res = await fetch(`/api/products/${productId}/cover`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function uploadImages(productId) {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    if (alts.some((a) => a && a.trim())) fd.append('alts', JSON.stringify(alts));
    const token = getToken();
    const res = await fetch(`/api/products/${productId}/images`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!canSubmit) {
      return setErr(
        'Completează titlu (≥3), preț/stoc valide, alege o imagine principală și cel puțin o imagine pentru galerie.'
      );
    }

    setSubmitting(true);
    try {
      const created = await api('/products', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          price: Number(price),
          stock: Number(stock),
          imageUrl: null,
          description: description.trim() || null,
          categoryId: categoryId ? Number(categoryId) : null,
        }),
      });

      await uploadCover(created.id);
      await uploadImages(created.id);

      setOk('Produs adăugat cu succes!');

      setTitle('');
      setPrice('');
      setStock(0);
      setDescription('');
      setCategoryId('');
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview('');
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setFiles([]);
      setAlts([]);

      if (typeof setPage === 'function') setPage('products');
    } catch (e2) {
      setErr(e2.message || 'Eroare neașteptată');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Panou administrator</p>
          <h1 className="admin-title">Adaugă un nou titlu</h1>
          <p className="admin-subtitle">
            Introdu detaliile cărții, alege coperta principală și imaginile de galerie. Câmpurile
            marcate cu * sunt obligatorii.
          </p>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => (typeof setPage === 'function' ? setPage('products') : null)}
        >
          Înapoi la catalog
        </button>
      </header>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="admin-grid">
          {/* Coloana principală: detalii text */}
          <section className="admin-column main">
            <div className="admin-field">
              <label className="admin-label">
                Titlu *
                <span className="admin-label-hint">minim 3 caractere</span>
              </label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Micul Prinț"
                required
              />
            </div>

            <div className="admin-field two-cols">
              <div>
                <label className="admin-label">Preț (RON) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 49.90"
                  required
                />
              </div>
              <div>
                <label className="admin-label">Stoc *</label>
                <input
                  className="input"
                  type="number"
                  step="1"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Număr de exemplare"
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Categorie (opțional)</label>
              <div className={`select-wrap ${catsLoading ? 'is-loading' : ''}`}>
                <select
                  className="select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={catsLoading}
                  aria-label="Categorie"
                >
                  <option value="">
                    {catsLoading ? 'Se încarcă categoriile…' : 'Alege categoria'}
                  </option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Descriere (opțional)</label>
              <textarea
                className="input"
                style={{ minHeight: 140, resize: 'vertical' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Note despre ediție, detalii despre conținut, public țintă etc."
              />
            </div>
          </section>
                  {/* Coloana laterală: imagini (o singură “carte” cu două secțiuni) */}
          <section className="admin-column side">
            <div className="admin-card">
              <h2 className="admin-card-title">Imagini</h2>
              <p className="admin-card-text">
                Gestionează coperta principală și galeria de imagini pentru acest titlu.
              </p>

              {/* bloc: copertă principală */}
              <div className="admin-block">
                <h3 className="admin-block-title">Copertă principală *</h3>
                <p className="admin-block-text">
                  Imaginea afișată în catalog. Recomandat raport 2:3, minim 800px înălțime.
                </p>

                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={onSelectCover}
                  required
                />

                <div className="cover-preview-card">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Previzualizare copertă"
                      className="cover-preview-img"
                    />
                  ) : (
                    <div className="cover-preview-placeholder small">
                      Nicio copertă selectată încă
                    </div>
                  )}
                </div>
              </div>

              {/* bloc: galerie imagini */}
              <div className="admin-block">
                <h3 className="admin-block-title">Galerie imagini *</h3>
                <p className="admin-block-text">
                  Poți încărca până la 12 imagini (interior, detalii de copertă, spate etc.).
                </p>

                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onSelectFiles}
                  required
                />

                {previews.length > 0 && (
                  <>
                    <div className="thumb-grid" style={{ marginTop: 10 }}>
                      {previews.map((src, idx) => (
                        <div key={idx} className="thumb">
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: 80,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="admin-field" style={{ marginTop: 10 }}>
                      <label className="admin-label">
                        Texte alternative (SEO / accesibilitate, opțional)
                      </label>
                      <div className="admin-alt-grid">
                        {previews.slice(0, 2).map((_, idx) => (
                          <input
                            key={idx}
                            className="input"
                            placeholder={`Alt pentru imaginea ${idx + 1}`}
                            value={alts[idx] || ''}
                            onChange={(e) => {
                              const a = [...alts];
                              a[idx] = e.target.value;
                              setAlts(a);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

         
        </div>

        <div className="admin-footer">
          <button className="btn" disabled={submitting || !canSubmit}>
            {submitting ? 'Se salvează…' : 'Salvează titlul'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => (typeof setPage === 'function' ? setPage('products') : null)}
          >
            Renunță
          </button>

          <div className="admin-status">
            {err && <span className="admin-msg error">{err}</span>}
            {ok && <span className="admin-msg success">{ok}</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
