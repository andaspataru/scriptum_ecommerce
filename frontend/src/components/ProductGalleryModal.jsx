import React, { useEffect, useMemo, useState, useCallback } from 'react';

const API_URL = import.meta.env?.VITE_API_BASE || 'http://localhost:4000';

function toPublicUrl(u) {
  if (!u) return '';
  let p = String(u).trim();

  if (/^https?:\/\//i.test(p)) {
    return p
      .replace('/public/public/', '/')
      .replace('/public/images/', '/images/')
      .replace('/public/', '/'); 
  }

  p = p.replace(/^\/+/, '');
  p = p.replace(/^public\/public\//i, '');
  p = p.replace(/^public\//i, '');

  if (!/^images\//i.test(p)) p = `images/${p}`;

  return `${API_URL}/${p}`;
}

export default function ProductGalleryModal({ productId, title, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(0);

  const fetchMedia = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/media?ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const imgs = (data.images ?? []).map((x) => {
        const raw = typeof x === 'string' ? x : x?.url;
        return {
          url: toPublicUrl(raw),
          alt: (typeof x === 'object' && x?.alt) || title || 'Imagine produs',
        };
      });

      setImages(imgs);
      setDescription(String(data.description ?? ''));
      setActive(0);
    } catch (e) {
      setErr(e?.message || 'Eroare la încărcarea galeriei.');
      setImages([]);
      setDescription('');
    } finally {
      setLoading(false);
    }
  }, [productId, title]);

  useEffect(() => { if (open) fetchMedia(); }, [open, fetchMedia]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (!images.length) return;
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Galerie ${title??''}`}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-head">
          <strong style={{fontSize:16}}>{title ?? 'Galerie produs'}</strong>
          <button className="btn ghost" style={{marginLeft:'auto'}} onClick={onClose}>Închide</button>
        </div>
        <div className="modal-body">
          {loading && <div>Se încarcă pozele…</div>}
          {err && <div style={{ color: 'crimson' }}>{err}</div>}
          {!loading && !err && images.length === 0 && <div>Nu există imagini pentru acest produs.</div>}

          {images.length > 0 && (
            <>
              <div style={{ position:'relative', background:'#f8f8f8', borderRadius:8, padding:8 }}>
                <img
                  src={images[active].url}
                  alt={images[active].alt || title || 'Imagine produs'}
                  style={{ width:'100%', maxHeight:'50vh', objectFit:'contain', borderRadius:6, userSelect:'none' }}
                />
                <button className="btn ghost" onClick={()=>setActive((i)=>(i-1+images.length)%images.length)}
                        aria-label="Anterior" style={{position:'absolute', top:'50%', left:8, transform:'translateY(-50%)'}}>←</button>
                <button className="btn ghost" onClick={()=>setActive((i)=>(i+1)%images.length)}
                        aria-label="Următor" style={{position:'absolute', top:'50%', right:8, transform:'translateY(-50%)'}}>→</button>
              </div>

              <div className="thumb-grid">
                {images.map((img, idx)=>(
                  <button key={idx} className="thumb" aria-current={idx===active} onClick={()=>setActive(idx)}>
                    <img src={img.url} alt={img.alt || `Thumb ${idx+1}`} style={{ width:'100%', height:64, objectFit:'cover', borderRadius:6 }}/>
                  </button>
                ))}
              </div>

              {description && (
                <div style={{ marginTop:12 }}>
                  <h4 style={{ margin:'8px 0' }}>Descriere</h4>
                  <p style={{ margin:0, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{description}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
