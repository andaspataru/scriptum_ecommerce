import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';

function toPublicUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `${location.origin}/${String(u).replace(/^\/?/, '')}`;
}

export default function EditProduct({ setPage }) {
  const user = useStore((s)=>s.user);
  const isAdmin = user?.role === 'admin';
  const [id] = useState(() => Number(localStorage.getItem('admin_edit_id') || 0) || 0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cover, setCover] = useState(null);

  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const [gallery, setGallery] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newAlts, setNewAlts] = useState([]);

  const canSubmit = useMemo(()=>{
    const p = Number(price); const s = Number(stock);
    return title.trim().length>=3 && !Number.isNaN(p) && p>=0 && Number.isInteger(s) && s>=0;
  }, [title, price, stock]);

  useEffect(()=>{
    if (!isAdmin) { setPage?.('home'); return; }
    if (!id) { alert('Selectează produsul din listă.'); setPage?.('products'); return; }
    (async()=>{
      try{
        setLoading(true);
        setCatsLoading(true);
        const rc = await fetch('/api/categories'); setCats(await rc.json());
        setCatsLoading(false);

        const rp = await fetch(`/api/products/${id}`);
        if (!rp.ok) throw new Error('Produs inexistent');
        const prod = await rp.json();
        setTitle(prod.title||'');
        setPrice(String(prod.price??''));
        setStock(Number(prod.stock||0));
        setDescription(prod.description||'');
        setCategoryId(prod.category?.id ? String(prod.category.id) : '');
        setCover(prod.imageUrl || null);

        const rm = await fetch(`/api/products/${id}/media?ts=${Date.now()}`);
        const media = await rm.json();
        setGallery(media.images || []);
      }catch(e){ setErr(e.message || 'Eroare la încărcare'); }
      finally{ setLoading(false); }
    })();
  }, [isAdmin, id, setPage]);

  function onSelectNewImages(e){
    const files = Array.from(e.target.files || []).slice(0,12);
    setNewImages(files);
    setNewAlts(Array(files.length).fill(''));
  }

  async function saveBasics(){
    if (!canSubmit) return;
    const payload = {
      title: title.trim(),
      price: Number(price),
      stock: Number(stock),
      description: description.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
    };
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('r_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) throw new Error(data?.error || 'Eroare la salvare');
    return data;
  }

  async function uploadCover(file){
    const fd = new FormData();
    fd.append('cover', file);
    const res = await fetch(`/api/products/${id}/cover`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('r_token')}` },
      body: fd,
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) throw new Error(data?.error || 'Eroare cover');
    setCover(data.cover);
  }

  async function uploadGallery(){
    if (!newImages.length) return;
    const fd = new FormData();
    newImages.forEach((f)=>fd.append('images', f));
    if (newAlts.some(a=>a && a.trim())) fd.append('alts', JSON.stringify(newAlts));
    const res = await fetch(`/api/products/${id}/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('r_token')}` },
      body: fd,
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) throw new Error(data?.error || 'Eroare upload galerie');
    setGallery((g)=>[...g, ...(data.images||[])]);
    setNewImages([]); setNewAlts([]);
  }

  async function deleteImage(imageId){
    const res = await fetch(`/api/products/images/${imageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('r_token')}` },
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) return alert(data?.error || 'Eroare la ștergere imagine');
    setGallery((g)=>g.filter(x=>x.id !== imageId));
  }

  async function saveAll(e){
    e.preventDefault(); setErr(null);
    try { await saveBasics(); if (newImages.length) await uploadGallery(); alert('Salvat ✔'); }
    catch(e){ setErr(e.message); }
  }

  async function onDeleteProduct(){
    if (!confirm('Ștergi produsul complet?')) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('r_token')}` },
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) return alert(data?.error || 'Eroare la ștergere');
    alert('Produs șters.');
    localStorage.removeItem('admin_edit_id');
    setPage?.('products');
  }

  if (!isAdmin) return null;
  if (loading) return <div>Se încarcă…</div>;
  if (err) return <div style={{color:'crimson'}}>{err}</div>;

  return (
    <div className="section">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div className="brand-badge" style={{ fontSize:20 }}>✏️</div>
        <div>
          <h3 style={{ margin:0 }}>Editează produs #{id}</h3>
          <div className="small">Actualizează informațiile și imaginile</div>
        </div>
        <button className="btn danger" style={{ marginLeft:'auto' }} onClick={onDeleteProduct}>Șterge produsul</button>
      </div>

      <form onSubmit={saveAll} style={{ display:'grid', gap:12, maxWidth:820 }}>
        <div className="form-row">
          <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titlu" required />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <input className="input" type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="Preț" required />
            <input className="input" type="number" min="0" step="1" value={stock} onChange={(e)=>setStock(e.target.value)} placeholder="Stoc" required />
          </div>
        </div>

        <div className="form-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
  {}
  <div className={`select-wrap ${catsLoading ? 'is-loading':''}`}>
    <select className="select" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)} disabled={catsLoading}>
      <option value="">{catsLoading ? 'Se încarcă…' : 'Categorie (opțional)'}</option>
      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  </div>

  {}
  <div>
    <input
      className="input"
      type="file"
      accept="image/*"
      onChange={(e)=>{ const f=e.target.files?.[0]; if (f) uploadCover(f).catch(err=>alert(err.message)); }}
    />
  </div>

  {}
  {cover && (
    <div style={{ gridColumn:'1 / -1' }}>
      <label className="small" style={{ display:'block', margin:'6px 0' }}>Previzualizare poză principală</label>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <img
          src={toPublicUrl(cover)}
          alt="cover"
          style={{ width:128, height:96, objectFit:'cover', borderRadius:8 }}
        />
        <span className="small" style={{ color:'var(--muted)', wordBreak:'break-all' }}>{cover}</span>
      </div>
    </div>
  )}
</div>


        <div>
          <textarea className="input" style={{ minHeight:120, resize:'vertical' }}
                    value={description} onChange={(e)=>setDescription(e.target.value)}
                    placeholder="Descriere" />
        </div>

        <div>
          <label className="small" style={{ display:'block', marginBottom:6 }}>Galerie existentă</label>
          {gallery.length === 0 && <div className="small" style={{ color:'var(--muted)' }}>Nu sunt imagini.</div>}
          {gallery.length > 0 && (
            <div className="thumb-grid">
              {gallery.map(img=>(
                <div key={img.id} className="thumb" style={{ padding:4 }}>
                  <img src={toPublicUrl(img.url)} alt={img.alt||'img'} style={{ width:'100%', height:72, objectFit:'cover', borderRadius:6 }}/>
                  <div className="small" style={{ marginTop:4, display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{img.alt || <i>(fără alt)</i>}</span>
                    <button
                      type="button"
                      className="btn ghost"
                      style={{ padding:'2px 6px', fontSize:12, lineHeight:1.2 }}
                      onClick={()=>deleteImage(img.id)}
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="small" style={{ display:'block', marginBottom:6 }}>Adaugă imagini noi (max 12)</label>
          <input className="input" type="file" accept="image/*" multiple onChange={onSelectNewImages}/>
          {newImages.length > 0 && (
            <>
              <div className="form-row" style={{ marginTop:6 }}>
                <input className="input" placeholder="Alt 1 (opțional)" value={newAlts[0]||''} onChange={(e)=>{ const a=[...newAlts]; a[0]=e.target.value; setNewAlts(a); }} />
                <input className="input" placeholder="Alt 2 (opțional)" value={newAlts[1]||''} onChange={(e)=>{ const a=[...newAlts]; a[1]=e.target.value; setNewAlts(a); }} />
              </div>
              <button type="button" className="btn" style={{ marginTop:8 }} onClick={()=>uploadGallery().catch(err=>alert(err.message))}>
                Încarcă imaginile
              </button>
            </>
          )}
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button className="btn" disabled={!canSubmit}>Salvează</button>
          <button type="button" className="btn ghost" onClick={()=>setPage?.('products')}>Înapoi</button>
          {err && <small style={{ color:'var(--danger)' }}>{err}</small>}
        </div>
      </form>
    </div>
  );
}
